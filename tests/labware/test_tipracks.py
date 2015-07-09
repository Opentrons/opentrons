from .grid import GridContainer, GridItem
from .liquids import LiquidContainer

class TiprackTest(unittest.TestCase):

	expected_margin = 9 # ANSI standard.

	def setUp(self):
		self.rack = labware.Tiprack()
		self.rack.calibrate(x=10, y=11, z=12)

	def a1_calibration_test(self):
		a1 = self.rack.slot('A1').coordinates()
		self.assertEqual(a1, (10, 11, 12))

	def a2_coordinate_test(self):
		a2 = self.rack.slot('A2').coordinates()
		self.assertEqual(a2, (10, 11+self.expected_margin, 12))

	def b1_coordinate_test(self):
		b1 = self.rack.slot('B1').coordinates()
		self.assertEqual(b1, (10+self.expected_margin, 11, 12))

	def b2_coordinate_test(self):
		b2 = self.rack.slot('B2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 11+margin, 12))

	def coordinate_lowercase_test(self):
		b2 = self.rack.slot('b2').coordinates()
		margin = self.expected_margin
		self.assertEqual(b2, (10+margin, 11+margin, 12))

	def row_sanity_test(self):

		row = chr( ord('a') + self.rack.rows + 1 )
		with self.assertRaises(ValueError):
			self.rack.slot('{}1'.format(row))
		
		row = chr( ord('a') + self.rack.rows - 1 )
		self.rack.slot('{}1'.format(row))

	def col_sanity_test(self):

		col = self.rack.cols + 1

		with self.assertRaises(ValueError):
			self.rack.slot('A{}'.format(col))

		col = self.rack.cols
		self.rack.slot('A{}'.format(col))

	def deck_calibration_test(self):

		config = {
			'calibration': {
				'a1': {
					'type':'tiprack_P2',
					'x': 10,
					'y': 11,
					'z': 12
				}
			}
		}

		deck = labware.Deck(a1=labware.Tiprack())
		deck.configure(config)

		margin = self.expected_margin

		rack = deck.slot('a1')

		a1 = rack.slot('a1').coordinates()
		b2 = rack.slot('b2').coordinates()

		self.assertEqual(a1, (10, 11, 12))
		self.assertEqual(b2, (10+margin, 11+margin, 12))

	def tip_inventory_test(self):

		self.assertEqual(self.rack.slot('a1').get_tip(), True)

		with self.assertRaises(Exception):
			self.rack.slot('a1').get_tip()

		""" Secondary syntax just in case. """

		slot = self.rack.slot('a2')
		self.assertEqual(slot.get_tip(), True)

		with self.assertRaises(Exception):
			slot.get_tip()