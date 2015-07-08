import unittest
import labware

class MicroplateTest(unittest.TestCase):

	expected_margin = 9 # ANSI standard.

	def setUp(self):
		self.plate = labware.Microplate()
		self.plate.calibrate(x=10, y=10, z=10)

	def a1_calibration_test(self):
		a1 = self.plate.well('A1').coordinates()
		self.assertEqual(a1, (10, 10, 10))

	def a2_coordinate_test(self):
		a2 = self.plate.well('A2').coordinates()
		self.assertEqual(a2, (10, 10+self.expected_margin, 10))

	def b1_coordinate_test(self):
		b1 = self.plate.well('B1').coordinates()
		self.assertEqual(b1, (10+self.expected_margin, 10, 10))

	def b2_coordinate_test(self):
		b2 = self.plate.well('B2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 10+margin, 10))

	def coordinate_lowercase_test(self):
		b2 = self.plate.well('b2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 10+margin, 10))

	def deck_calibration_test(self):

		m_offset = 10

		config = {
			'calibration': {
				'a1': {
					'type':'microplate_96',
					'x': m_offset,
					'y': m_offset,
					'z': m_offset
				}
			}
		}

		deck = labware.Deck(a1=labware.Microplate())
		deck.configure(config)

		margin = self.expected_margin

		plate = deck.slot('a1')

		a1 = plate.well('a1').coordinates()
		b2 = plate.well('b2').coordinates()

		self.assertEqual(a1, (m_offset, m_offset, m_offset))
		self.assertEqual(b2, (m_offset+margin, m_offset+margin, m_offset))


class TiprackTest(unittest.TestCase):

	expected_margin = 9 # ANSI standard.

	def setUp(self):
		self.rack = labware.Tiprack()
		self.rack.calibrate(x=10, y=10, z=10)

	def a1_calibration_test(self):
		a1 = self.rack.slot('A1').coordinates()
		self.assertEqual(a1, (10, 10, 10))

	def a2_coordinate_test(self):
		a2 = self.rack.slot('A2').coordinates()
		self.assertEqual(a2, (10, 10+self.expected_margin, 10))

	def b1_coordinate_test(self):
		b1 = self.rack.slot('B1').coordinates()
		self.assertEqual(b1, (10+self.expected_margin, 10, 10))

	def b2_coordinate_test(self):
		b2 = self.rack.slot('B2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 10+margin, 10))

	def coordinate_lowercase_test(self):
		b2 = self.rack.slot('b2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 10+margin, 10))

	def deck_calibration_test(self):

		m_offset = 10

		config = {
			'calibration': {
				'a1': {
					'type':'tiprack_P2',
					'x': m_offset,
					'y': m_offset,
					'z': m_offset
				}
			}
		}

		deck = labware.Deck(a1=labware.Tiprack())
		deck.configure(config)

		margin = self.expected_margin

		rack = deck.slot('a1')

		a1 = rack.slot('a1').coordinates()
		b2 = rack.slot('b2').coordinates()

		self.assertEqual(a1, (m_offset, m_offset, m_offset))
		self.assertEqual(b2, (m_offset+margin, m_offset+margin, m_offset))

	def tip_inventory_test(self):

		self.assertEqual(self.rack.slot('a1').get_tip(), True)

		with self.assertRaises(Exception):
			self.rack.slot('a1').get_tip()

		""" Secondary syntax just in case. """

		slot = self.rack.slot('a2')
		self.assertEqual(slot.get_tip(), True)

		with self.assertRaises(Exception):
			slot.get_tip()
