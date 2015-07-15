import unittest
import labware

class DeckTest(unittest.TestCase):

    def setUp(self):
        self.deck = labware.Deck()

    def test_module_add(self):
        self.deck.add_modules(a1=labware.Microplate())
        plate = self.deck.slot('a1')
        self.assertTrue(isinstance(plate, labware.Microplate)) 

    def test_module_add_to_filled_slot(self):
        self.deck.add_modules(a1=labware.Microplate())
        with self.assertRaises(Exception):
            self.deck.add_modules(a1=labware.Microplate())

    def test_module_access_empty_slot(self):
        with self.assertRaises(KeyError):
            self.deck.slot('a1')
