"""
This script takes a 15 nucleotide target sequence for a TALEN protein and 
outputs an OT-One protocol to assemble it with the pFusX system.

Input is a string representing an RVD sequence, whitespace optional, 
such as:

> NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG

Or DNA, such as:

> ATACCGTCTTATTTT

Output is a JSON file which represents a protocol that can run on any
OT-One machine.
"""

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
