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

import re

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
				"Invalid character: 'Y'; pyrimidines must be specified."
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

