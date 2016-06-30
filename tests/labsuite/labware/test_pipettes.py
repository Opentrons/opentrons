import unittest
from labsuite.labware import pipettes


class MockPipette(pipettes.Pipette):
    min_vol = 0
    max_vol = 10

    _top = None
    _blowout = None
    _droptip = None

    _points = [
        {'f1': 1, 'f2': 1},
        {'f1': 10, 'f2': 10}
    ]


class PipetteTest(unittest.TestCase):

    def setUp(self):
        self.pipette = MockPipette()

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
        self.pipette.calibrate(top=15, blowout=115)
        depth = self.pipette.plunge_depth(1)
        self.assertEqual(depth, 25)

    def test_max_volume(self):
        """Returns percentage for max volume."""
        self.pipette._volume_percentage(10)

    def test_load_instrument(self):
        """Loads instruments."""
        p = pipettes.load_instrument('p10')
        self.assertIsInstance(p, pipettes.Pipette_P10)
