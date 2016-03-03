import unittest

from labsuite.labware import containers
from labsuite.labware.deck import Deck
from labsuite.labware.microplates import Microplate

class DeckTest(unittest.TestCase):

    def setUp(self):
        self.deck = Deck()

    def test_module_add(self):
        """Add a module to the deck."""
        self.deck.add_modules(a1=Microplate())
        plate = self.deck.slot('a1')
        self.assertTrue(isinstance(plate, Microplate))

    def test_module_add_by_container_name(self):
        """ Add a module to deck by container name. """
        self.deck.add_module('a1', 'microplate.96')
        plate = self.deck.slot('a1')
        self.assertTrue(isinstance(plate, Microplate))

    def test_modules_add_by_container_name(self):
        """ Add modules to deck by container name. """
        self.deck.add_modules(
            a1='microplate.96',
            a2='microplate.96.deepwell'
        )
        self.assertEqual(self.deck.slot('a1').name, 'microplate.96')
        self.assertEqual(self.deck.slot('a2').name, 'microplate.96.deepwell')

    def test_module_add_to_filled_slot(self):
        """Raise when adding module to filled deck slot."""
        self.deck.add_modules(a1=Microplate())
        with self.assertRaises(Exception):
            self.deck.add_modules(a1=Microplate())

    def test_module_access_empty_slot(self):
        """Raise when accessing empty deck slot."""
        with self.assertRaises(KeyError):
            self.deck.slot('a1')

    def test_slot_out_of_range(self):
        """Raise when accessing out-of-range deck slot."""
        with self.assertRaises(KeyError):
            self.deck.slot('z1')

    def test_custom_calibration_point(self):
        """ Allow for setting custom calibration points. """
        self.deck.add_modules(a1=Microplate())
        plate = self.deck.slot('a1')
        plate.calibrate(x=1, y=2, z=3)
        self.assertEqual(plate.well('a1').coordinates(), (1, 2, 3))
        plate.well('b10').calibrate(4, 5, 6)
        self.assertEqual(plate.well('b10').coordinates(), (4, 5, 6))