import unittest
import labware

class MicroplateTest(unittest.TestCase):

	def setUp(self):
		self.deck = labware.Deck()

	def test_module_add(self):
		self.deck.add_modules(a1=labware.Microplate())
		plate = self.deck.slot('a1')
		self.assertTrue(isinstance(plate, labware.Microplate)) 
