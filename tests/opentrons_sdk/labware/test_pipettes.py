import unittest

from opentrons_sdk.labware import instruments
from opentrons_sdk.protocol.protocol import Protocol


class PipetteTest(unittest.TestCase):

    def setUp(self):
        Protocol.reset()
        self.pipette = instruments.Pipette(
            axis='b',
            channels=1,
            min_vol=1
        )
        self.pipette.max_vol = 10

    def test_volume_beyond_range(self):
        """Rejects volume beyond max range."""
        with self.assertRaises(IndexError):
            self.pipette._volume_percentage(11)

    def test_volume_below_zero(self):
        """Rejects volume below zero."""
        with self.assertRaises(IndexError):
            self.pipette._volume_percentage(-1)

    def test_percentages(self):
        """Linear percentages."""
        # The point map is just linear...
        for i in range(1, 10):
            n = self.pipette._volume_percentage(i)
            self.assertEqual(n, i / 10)

    def test_plunge_depth(self):
        """Calculates plunger depth."""
        self.pipette.calibrate(top=15, bottom=115)
        depth = self.pipette.plunge_depth(1)
        self.assertEqual(depth, 25)

    def test_max_volume(self):
        """Returns percentage for max volume."""
        self.pipette._volume_percentage(10)

    # def test_load_instrument(self):
    #     """Loads instruments."""
    #     p = instruments.load_instrument('p10')
    #     self.assertIsInstance(p, instruments.Pipette_P10)

    def test_volume_support(self):
        """ Volume support. """
        self.assertEqual(self.pipette.supports_volume(10), True)
        self.assertEqual(self.pipette.supports_volume(1), True)
        self.assertEqual(self.pipette.supports_volume(0), False)
        self.assertEqual(self.pipette.supports_volume(11), False)
