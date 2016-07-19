import unittest
from opentrons_sdk.labware.deck import Deck
from opentrons_sdk.labware.microplates import Microplate
from opentrons_sdk.labware.tipracks import Tiprack


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
        with self.assertRaises(KeyError):
            self.deck.add_modules(a1=Microplate())

    def test_module_access_empty_slot(self):
        """Raise when accessing empty deck slot."""
        with self.assertRaises(KeyError):
            self.deck.slot('a1')

    def test_slot_out_of_range(self):
        """Raise when accessing out-of-range deck slot."""
        with self.assertRaises(KeyError):
            self.deck.slot('z1')

    def test_find_module(self):
        self.deck.add_module('a1', 'microplate.96')
        plate = self.deck.find_module(name='microplate.96')
        self.assertIsInstance(plate, Microplate)
        self.deck.add_module('a2', 'tiprack.p10')
        rack = self.deck.find_module(size='P10')
        self.assertIsInstance(rack, Tiprack)

    def test_module_address(self):
        """ Return module address as list of tuples. """
        self.deck.add_module('B3', 'microplate.96')
        slot = self.deck.slot('B3')
        well = slot.well('H2')
        self.assertEqual(slot.address, [(1, 2)])
        self.assertEqual(well.address, [(1, 2), (7, 1)])
