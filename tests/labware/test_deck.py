import unittest
import labware


class DeckTest(unittest.TestCase):

    def setUp(self):
        self.deck = labware.Deck()

    def test_module_add(self):
        """Add a module to the deck."""
        self.deck.add_modules(a1=labware.Microplate())
        plate = self.deck.slot('a1')
        self.assertTrue(isinstance(plate, labware.Microplate))

    def test_module_add_to_filled_slot(self):
        """Raise when adding module to filled deck slot."""
        self.deck.add_modules(a1=labware.Microplate())
        with self.assertRaises(Exception):
            self.deck.add_modules(a1=labware.Microplate())

    def test_module_access_empty_slot(self):
        """Raise when accessing empty deck slot."""
        with self.assertRaises(KeyError):
            self.deck.slot('a1')

    def test_slot_out_of_range(self):
        """Raise when accessing out-of-range deck slot."""
        with self.assertRaises(KeyError):
            self.deck.slot('z1')

    def test_return_calibration(self):
        self.deck.add_modules(a1=labware.Microplate(), a2=labware.Microplate())
        a1 = self.deck.slot('a1')
        a1.start_x = 10
        a1.start_y = 11
        a1.start_z = 12

        a2 = self.deck.slot('a2')
        a2.start_x = 13
        a2.start_y = 14
        a2.start_z = 15
        self.assertEqual(self.deck.dump_calibration(), {'A1': (10, 11, 12), 'A2': (13, 14, 15)})

