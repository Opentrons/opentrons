import unittest
from labsuite.compilers import pfusx

class PFUSXTest(unittest.TestCase):

	def test_dna_to_rvd(self):
		"""
		Translate DNA to RVD pairs.
		"""
		expected = 'NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG'
		rvd = pfusx.dna_to_rvd('ATACCGTCTTATTTT')
		self.assertEqual(rvd, expected)

	def test_dna_to_rvd_allow_unspecified_purine(self):
		"""
		Translate DNA to RVD pairs with unspecified purines.
		"""
		expected = 'NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG'
		rvd = pfusx.dna_to_rvd('ATACCRTCTTATTTT')
		self.assertEqual(rvd, expected)

	def test_dna_to_rvd_disallow_unspecified_pyrimidines(self):
		"""
		Translate DNA to RVD pairs only with specified pyrimidines.
		"""
		with self.assertRaises(ValueError):
			pfusx.dna_to_rvd('AYACCGTCTTATTTT')

	def test_dna_to_rvd_invalid_character(self):
		"""
		Translate DNA to RCD pairs, minus invalid characters.
		"""
		with self.assertRaises(ValueError):
			pfusx.dna_to_rvd('AXACCGTCTTATTTT')

	def test_rvd_to_tal(self):
		"""
		Translate RVD2 to TAL2.
		"""

		# Various input formats.
		stripped = 'NIHDNGNNNN'
		slashes = 'NI/HD/NG/NN/NN'
		spaces = 'NI HD NG NN NN'
		dashes = 'NI-HD-NG-NN-NN'
		commas = 'NI,HD,NG,NN,NN'
		space_commas = 'NI, HD, NG, NN, NN'

		# Uniform output.
		expected = 'ACTGG'

		self.assertEqual(pfusx.rvd_to_tal(stripped), expected)
		self.assertEqual(pfusx.rvd_to_tal(slashes), expected)
		self.assertEqual(pfusx.rvd_to_tal(spaces), expected)
		self.assertEqual(pfusx.rvd_to_tal(dashes), expected)
		self.assertEqual(pfusx.rvd_to_tal(commas), expected)
		self.assertEqual(pfusx.rvd_to_tal(space_commas), expected)

	def test_rvd_invalid_input(self):
		"""
		Don't accept invalid RVD sequences.
		"""
		with self.assertRaises(ValueError):
			pfusx.rvd_to_tal("This is not valid input.")
		with self.assertRaises(ValueError):
			pfusx.rvd_to_tal("atatatagatataga")  # DNA and not RVD

	def test_tal_sequence(self):
		""" 
		Segment TAL sequence.
		"""
		result = pfusx.tal_to_codons('ATACCRTCTTATTT')
		expected = ['ATA', 'CCR', 'TCT', 'TAT', 'TTT']
		self.assertEqual(result, expected)

	def test_tal_sequence_sixteen(self):
		"""
		Segment 16-character TAL sequence.
		"""
		result = pfusx.tal_to_codons('ATACCRTCTTATTTA')
		expected = ['ATA', 'CCR', 'TCT', 'TAT', 'TTTA']
		self.assertEqual(result, expected)

	def test_fusx_query(self):
		"""
		Query FusX database to find the well positions of necessary plasmids.
		"""
		# Example from the FusX PHP script at <http://talendesign.org>.
		rvd = pfusx.rvd_to_tal('NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG')
		sequences = pfusx.tal_to_codons(rvd)
		result = pfusx.get_fusx_locations(sequences)
		expected = [
			('pFX1', 'E2'), ('pFX2', 'G3'), ('pFX3', 'H7'), ('pFX4', 'D7'),
			('pB2/B3', 'H12')
		]
		self.assertEqual(result, expected)

	def test_well_locations(self):
		target = 'NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG'
		result = pfusx.get_plasmid_wells(target)
		expected = {
			'pfusx_1': 'E2',
			'pfusx_2': 'G3',
			'pfusx_3': 'H7',
			'pfusx_4': 'D7',
			'pfusx_5': 'H12',
			'receiver': 'B12',
			'backbone': 'C11'
		}
		self.assertEqual(result, expected)

	def test_make_transfer(self):
		expected = {
			"transfer": [{
				"from": {
					"container": 'FOO',
					"location": 'A1'
				},
				"to": {
					"container": 'BAR',
					"location": "B1",
					"touch-tip": True
				},
				"volume": 10,
				"blowout": True
			}]
		}
		result = pfusx._make_transfer('FOO:A1', 'BAR:B1', 10)
		self.assertEqual(expected, result)

	def test_format_transfers(self):
		"""
		Format transfers for JSON protocol 1.0.
		"""

		seq = 'NI NG NI HD HD NN NG HD NG NG NI NG NG NG NG'
		result = pfusx._format_transfers(seq, well='B2')

		# Sorry, this is long.
		expected = [{
			'transfer': [{
				'volume': 10,
				'blowout': True,
				'from': {
					'location': 'A1',
					'container': 'Ingredients'
				},
				'to': {
					'location': 'B2',
					'container': 'FusX Output',
					'touch-tip': True
				}
			}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'A1',
						'container': 'Ingredients'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'E2',
						'container': 'TALE1'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'G3',
						'container': 'TALE2'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'H7',
						'container': 'TALE3'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'D7',
						'container': 'TALE4'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'H12',
						'container': 'TALE5'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'B12',
						'container': 'TALE5'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 3,
					'blowout': True,
					'from': {
						'location': 'C11',
						'container': 'TALE5'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 6,
					'blowout': True,
					'from': {
						'location': 'A1',
						'container': 'Ingredients'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
			}, {
				'transfer': [{
					'volume': 5,
					'blowout': True,
					'from': {
						'location': 'A1',
						'container': 'Ingredients'
					},
					'to': {
						'location': 'B2',
						'container': 'FusX Output',
						'touch-tip': True
					}
				}]
		}]

		self.assertEqual(expected, result)