import unittest

from opentrons_sdk.containers.calibrator import Calibrator
from opentrons_sdk.containers.placeable import (
    Container,
    Well,
    Deck,
    Slot)


class CalibratorTestCase(unittest.TestCase):
    def generate_deck(self):
        deck = Deck()
        slot = Slot()
        deck.add(slot, 'A1', (5, 10, 0))
        c = Container()
        red = Well(properties={'radius': 5})
        blue = Well(properties={'radius': 5})
        c.add(red, "Red", (5, 5, 0))
        c.add(blue, "Blue", (15, 5, 0))
        slot.add(c, 'tube_rack')

        return deck

    def test_apply_calibration(self):
        deck = self.generate_deck()
        calibration_data = {
            'A1':
            {
                'delta': (1, 1, 1),
                'children': {
                    'tube_rack': {
                        'delta': (1, 1, 1),
                        'children': {
                            'Red':
                            {
                                'delta': (1, 1, 1)
                            },
                            'Blue':
                            {
                                'delta': (2, 2, 2)
                            }
                        }
                    }
                }
            }
        }
        my_calibrator = Calibrator()
        new_deck = my_calibrator.apply_calibration(calibration_data, deck)

        self.assertEquals(
            new_deck['A1']['tube_rack']['Red'].coordinates(new_deck),
            (13, 18, 3))
        self.assertEquals(
            new_deck['A1']['tube_rack']['Blue'].coordinates(new_deck),
            (24, 19, 4))

    def test_convert(self):
        deck = self.generate_deck()
        calibration_data = {
            'A1':
            {
                'delta': (1, 1, 1),
                'children': {
                    'tube_rack': {
                        'delta': (1, 1, 1),
                        'children': {
                            'Red':
                            {
                                'delta': (1, 1, 1)
                            },
                            'Blue':
                            {
                                'delta': (2, 2, 2)
                            }
                        }
                    }
                }
            }
        }
        my_calibrator = Calibrator()
        res = my_calibrator.convert(
            calibration_data,
            deck['A1']['tube_rack']['Blue'],
            deck['A1']['tube_rack']['Blue'].center())
        self.assertEqual(res, (29.0, 24.0, 4.0))

        res = my_calibrator.convert(
            calibration_data,
            deck['A1']['tube_rack'])
        self.assertEqual(res, (7, 12, 2))

    def test_calibrate(self):
        deck = self.generate_deck()
        my_calibrator = Calibrator()
        calibration_data = {}

        current_position = (14, 19, -1)
        tube_rack = deck['A1']['tube_rack']
        expected = tube_rack['Red'].center(tube_rack)

        new_calibration_data = my_calibrator.calibrate(
            calibration_data,
            (deck['A1']['tube_rack'], expected),
            current_position)

        expected_result = {
            'A1': {
                'children': {
                    'tube_rack': {
                        'delta': (-1.0, -1.0, -1.0)
                    }
                }
            }
        }
        self.assertDictEqual(new_calibration_data, expected_result)

        # apply calibration data to the original deck and get actual back
        new_deck = my_calibrator.apply_calibration(new_calibration_data, deck)
        self.assertEquals(
            new_deck['A1']['tube_rack']['Red'].center(new_deck),
            current_position)
