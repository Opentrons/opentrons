import unittest
from compilers import pfusx

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