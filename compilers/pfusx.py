"""
This script takes a 15 nucleotide target sequence for a TALEN protein and 
outputs an OT-One protocol to assemble it with the pFusX system, which
provides a pre-plated library of RVDs.

Input is a string representing an RVD sequence, whitespace optional, 
such as:

> NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG

Or DNA, such as:

> ATACCGTCTTATTTT

Output is a JSON file which represents a protocol that can run on any
OT-One machine.
"""

import os
import re
import sqlite3

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
	codes = map(''.join, zip(*[iter(string)]*2))  # Two-character segments.
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
	sequences = []
	for n in range(0, 12, 3):  # Chunk into four parts of 3.
		sequences.append(tal[n:n+3])
	sequences.append(tal[11:])  # Grab the last 2, 3 or 4 bases.
	return sequences

def get_transfers(sequences):
	"""
	Takes an array of five codons and outputs a list of well and plate
	positions for producing the final recombined plasmid using the
	FusX system.
	"""
	if len(sequences) != 5:
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
	for i, codon in enumerate(sequences):
		codon_index = i+1
		if codon_index < 5:
			plasmid_name = 'pFUX{}_{}'.format(codon_index, codon)
		else:
			codon = codon[0:-1] # Ignore the last basepair.
			plasmid_name = 'pFUSB{}_{}'.format(len(codon), codon)
		rvd = dna_to_rvd(codon)
		queries.append((rvd, plasmid_name))

	# Send it to the database.
	connection = sqlite3.connect(os.path.dirname(__file__)+'/data/pFusX.db')
	cursor = connection.cursor()
	results = []
	for args in queries:
		cursor.execute(sql, args)
		result = cursor.fetchone()
		if not result:
			raise ValueError("Can't find plasmid named {}.".format(args[1]))
		results.append(result)
	return results
	