"""
This script takes a 15 nucleotide target sequence followed by a base pair
representing the receiver plasmid.

It outputs an OT-One protocol to assemble a TALEN protein with the pFusX
system, which provides a pre-plated library of plasmids and a database
of well positions for this script to query.

Input is a string representing an RVD sequence, whitespace optional,
such as:

> NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG

Or DNA, such as:

> ATACCGTCTTATTTT

Output is a JSON file which represents a protocol that can run on any
OT-One machine.
"""

import sys
import os
import re
import json
import sqlite3
import datetime

from collections import OrderedDict


def dna_to_rvd(string):
    """
    Translates a DNA string to RVD.
    """
    translation = {
        'A': 'NI',
        'C': 'HD',
        'T': 'NG',
        'G': 'NN',
        'R': 'NN'  # Just assume G if purine is unspecified.
    }
    string = string.upper()
    rvd = []
    for c in string:
        if c is 'Y':
            # Apparently for restriction enzymes pyridians need to be more
            # specific than purines.
            raise ValueError(
                "Invalid base: 'Y'; pyrimidines must be specified."
            )
        elif c not in translation:
            raise ValueError("Invalid character: {}".format(c))
        else:
            rvd.append(translation[c])
    return ' '.join(rvd)


def rvd_to_tal(string):
    """
    Translates an RVD string into TAL.

    Very similar to a reverse of dna_to_rvd, but DNA->RVD2->TAL2 will return
    a normalized result rather than the original input.
    """
    translation = {
        'NI': 'A',
        'HD': 'C',
        'NG': 'T',
        'NN': 'G'
    }
    out = []
    string = string.upper()  # Convert input to uppercase;
    string = re.sub(r'[^A-Z]+', '', string)  # remove any separators.
    codes = map(''.join, zip(*[iter(string)] * 2))  # Two-character segments.
    for code in codes:
        if code not in translation:
            raise ValueError("Invalid RVD sequence: {}".format(code))
        else:
            out.append(translation[code])
    return ''.join(out)


def tal_to_codons(tal):
    """
    Takes a 15 or 16-base ATGC sequence and outputs an array of five
    codon sequences after doing validation.
    """
    if re.match(r'[^ACTG]]', tal):  # Content check.
        raise ValueError("FusX TALEN sequence must be in ACTG form.")
    codons = []
    for n in range(0, 12, 3):  # Chunk into four parts of 3.
        codons.append(tal[n:n + 3])
    codons.append(tal[11:])  # Grab the last 2, 3 or 4 bases.
    return codons


def get_fusx_locations(codons):
    """
    Takes an array of five codons and outputs a list of well and plate
    positions for producing the final recombined plasmid using the
    FusX system.

    Each plasmid chosen depends on the codon and also the index of the
    codon in the full target sequence.

    This code assumes that the target sequence also includes the
    receiver plasmid at the end, and as such discards the last RVD
    basepair.
    """

    if len(codons) != 5:
        raise ValueError("Sequence must be an array of five codons.")

    # We're using a SQL database provided by the FusX team. Important fields
    # for our purposes are well, plate, rvd_sequence, and plasmid_name.

    # plasmid_name is a special composite key of a prefix, the codon index,
    # and the TAL sequence. For example, pFUX1_TTC targets TTC as the first
    # codon in a sequence of codons. The target codon is redundantly stored
    # as an RVD sequence, but no field in the table provides the codon
    # index as a standalone field.

    sql = """
        SELECT plate, well FROM pFUX_recipe_library
        WHERE rtrim(rvd_sequence)=? AND plasmid_name=?
    """

    queries = []
    for i, codon in enumerate(codons):
        codon_index = i + 1
        if codon_index < 5:
            plasmid_name = 'pFUX{}_{}'.format(codon_index, codon)
        else:
            codon = codon[0:-1]  # Ignore last basepair (receiver plasmid).
            plasmid_name = 'pFUSB{}_{}'.format(len(codon), codon)
        rvd = dna_to_rvd(codon)
        queries.append((rvd, plasmid_name))

    # Send it to the database.
    connection = sqlite3.connect(os.path.dirname(__file__) + '/data/pFusX.db')
    cursor = connection.cursor()
    results = []
    for args in queries:
        cursor.execute(sql, args)
        result = cursor.fetchone()
        if not result:
            raise ValueError("Can't find plasmid named {}.".format(args[1]))
        results.append(result)  # Result is (plate, well)
    connection.close()
    return results


def get_plasmid_wells(sequence, backbone='DNA'):
    """
    Takes a string of either RVD or DNA basepairs (15 or 16), does a
    bunch of input normalization and outputs a hash containing well
    positions for pfusx_[1..5], receiver, and backbone.

    No plate data is necessary at the moment; those are hard-coded in the
    template.
    """

    codons = tal_to_codons(rvd_to_tal(sequence))  # Misdirection, sorry.

    # The receiver plasmid depends on the last basepair of the RVD input
    # and isn't stored in the provided pFusX database.
    receiver_map = {
        'HD': 'A11',
        'NN': 'A12',
        'NI': 'B11',
        'NG': 'B12'
    }

    # We only actually need well coordinates for these because the plate
    # names are hard-coded into the pFusX JSON template.
    well_locs = {}

    # We pull the FusX plasmid locations from the database, five in total.
    plasmid_locs = get_fusx_locations(codons)
    for i, loc in enumerate(plasmid_locs):
        well_locs['pfusx_{}'.format(i + 1)] = loc[1]  # Well position.

    # The last basepair of input is the receiver plasmid.
    receiver_bp = sequence[-2:]
    well_locs['receiver'] = receiver_map.get(receiver_bp, None)
    if not well_locs['receiver']:
        raise ValueError("Invalid receiver: {}".format(receiver_bp))

    # The backbone plasmid varies for DNA expression or RNA expression.
    backbone = backbone.upper()
    if backbone == 'DNA':
        well_locs['backbone'] = 'C11'
    elif backbone == 'RNA':
        well_locs['backbone'] = 'C12'
    else:
        raise ValueError("Expression backbone must be DNA or RNA.")

    return well_locs


def _make_transfer_group(*transfers, reuse_tip=False):
    """
    Takes a bunch of trasfer tuples (start, end, volume) and returns a
    transfer group formatted for the OT-One protocol.

    If group is set to True, the transfers will be done with a single
    tip. Good when you're moving one particular mixture, bad when you're
    mixing different things because it contaminates the tips.
    """
    if reuse_tip:
        group = {"transfer": []}
        for t in transfers:
            group["transfer"].append(_make_transfer(*t))
    else:
        group = []
        for t in transfers:
            group.append({"transfer": [_make_transfer(*t)]})

    return group


def _make_transfer(start, end, volume, touch=True):
    """
    Creates a new transfer object for injection into an instruction group
    within the OpenTrons JSON Protocol format.

    Start and end are strings in <Plate Name>:<Well> format, for example
    `Ingredients:A1`. You can have spaces in the name.

    We're not doing any normalizing or validation on this yet; be careful!
    """

    try:
        fplate, fwell = start.split(':')
        tplate, twell = end.split(':')
    except ValueError:
        raise ValueError(
            "Start and end must be in <plate>:<well> format (Plate:A1)."
        )

    return OrderedDict([
        ("from", OrderedDict([
            ("container", fplate),
            ("location", fwell)
        ])),
        ("to", OrderedDict([
            ("container", tplate),
            ("location", twell),
            ("touch-tip", touch)
        ])),
        ("volume", volume),
        ("blowout", True)
    ])


def _get_tal_transfers(sequence, well='A1', backbone='DNA'):
    """
    Creates an array of transfer arguments for a TAL sequence.
    """

    output_well = "FusX Output:{}".format(well)
    plasmids = get_plasmid_wells(sequence, backbone)

    # TAL Plasmid transfers
    tals = []
    for n in range(1, 6):  # TALEN plasmids, 1 through 5
        tals.append(
            (
                "TALE{}:{}".format(n, plasmids['pfusx_{}'.format(n)]),
                output_well,
                3
            )
        )

    # Backbone and Receiver transfers
    backbone = [('TALE5:{}'.format(plasmids['backbone']), output_well, 3)]
    receiver = [('TALE5:{}'.format(plasmids['receiver']), output_well, 3)]

    return tals + receiver + backbone


def _normalize_sequence(sequence):
    """
    Validate and normalize input sequences to RVD.
    """

    # Uppercase; no separators, A-Z only.
    sequence = sequence.upper()
    sequence = re.sub(r'[^A-Z]+', '', sequence)

    # Normalize to RVD input.
    if re.match(r'^[ATGCYR]*$', sequence):  # Match: DNA bases.
        sequence = re.sub('\s', '', dna_to_rvd(sequence))
    elif re.match(r'^[NIHDG]*$', sequence):  # Match: RVD bases.
        sequence = sequence
    else:
        raise ValueError("Input must be a sequence of RVD or DNA bases.")

    if len(sequence) not in [32, 30]:
        raise ValueError("Sequence must be 15 RNA or DNA bases.")

    return sequence

def compile(*sequences, output=None):
    """
    Takes a list of sequence arguments (RVD or DNA) and outputs a generated
    protocol to make plasmids targetting those sequences.
    """
    sequences = list(sequences)

    # Limit right now is the number of tips in the static deck map we're
    # using for this protocol.
    if len(sequences) > 15:
        raise ValueError(
            "FusX compiler only supports up to 15 sequences."
        )

    # Argument normalization.
    normalized = []
    for i, s in enumerate(sequences):
        try:
            normalized.append(_normalize_sequence(s))
        except ValueError as e:
            raise ValueError("Sequence #{}: {}".format(i + 1, e))

    # Make the transfers for every sequence.
    buffers = []
    tals = []
    enzymes = []

    well_map = {}
    for n, s in enumerate(normalized):
        n = n + 1
        if n > 12:
            well = 'B{}'.format(n - 12)
        else:
            well = 'A{}'.format(n)
        # We're going to do all the buffers at the start...
        buffers += [('Ingredients:A1', 'FusX Output:' + well, 10)]
        # TALs in the middle...
        tals +=  _get_tal_transfers(s, well=well)
        # Enzyme (BsmBI) at the end.
        enzymes += [("Ingredients:B1", 'FusX Output:' + well, 10)]
        # For printing an output map.
        well_map[well] = sequences[n - 1]  # Map to original input.

    # Nicely formatted well map for the description.
    output_map = []
    for well in sorted(well_map):
        output_map.append("{}: {}".format(well, well_map[well]))

    # Take our three transfer groups and make them into a consolidated
    # transfer list.
    instructions = []
    instructions.append(_make_transfer_group(*buffers, reuse_tip=True))
    instructions.append(_make_transfer_group(*tals))
    instructions.append(_make_transfer_group(*enzymes))

    # Open up our template and inject the transfers.
    with open(os.path.dirname(__file__) + '/templates/pfusx.json') as data:
        protocol = json.JSONDecoder(
            object_pairs_hook=OrderedDict
        ).decode(data.read())

    protocol['instructions'][0]['groups'] = instructions
    protocol['info']['create-date'] = str(datetime.date.today())
    protocol['info']['description'] = "; ".join(output_map)

    compiled = json.dumps(protocol, indent=4)

    if output:
        with open(output, 'w') as f:
            f.write(compiled)

    return compiled
