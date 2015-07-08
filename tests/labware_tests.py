import unittest
import labware

class MicroplateTest(unittest.TestCase):

	expected_margin = 9 # ANSI standard.

	def a1_calibration_test(self):
		plate = labware.Microplate()
		plate.calibrate(x=10, y=10, z=10)
		self.assertEqual(plate.well('A1').coordinates(), (10, 10, 10))

	def a2_calibration_test(self):
		plate = labware.Microplate()
		plate.calibrate(x=10, y=10, z=10)
		a2 = plate.well('A2').coordinates()
		self.assertEqual(a2, (10, 10+self.expected_margin, 10))

	def b1_calibration_test(self):
		plate = labware.Microplate()
		plate.calibrate(x=10, y=10, z=10)
		b1 = plate.well('B1').coordinates()
		self.assertEqual(b1, (10+self.expected_margin, 10, 10))

	def b2_calibration_test(self):
		plate  = labware.Microplate()
		plate.calibrate(x=10, y=10, z=10)
		b2 = plate.well('B2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 10+margin, 10))

	def calibration_lowercase_test(self):
		plate  = labware.Microplate()
		plate.calibrate(x=10, y=10, z=10)
		b2 = plate.well('b2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 10+margin, 10))