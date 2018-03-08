import unittest

from opentrons.containers.calibrator import Calibrator
from opentrons.containers.placeable import (
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
                'type': 'Slot',
                'delta': (1, 1, 1),
                'children': {
                    'tube_rack': {
                        'type': 'tube-rack-2ml',
                        'delta': (1, 1, 1),
                        'children': {
                            'Red':
                            {
                                'type': 'Well',
                                'delta': (1, 1, 1)
                            },
                            'Blue':
                            {
                                'type': 'Well',
                                'delta': (2, 2, 2)
                            }
                        }
                    }
                }
            }
        }
        my_calibrator = Calibrator(deck, calibration_data)

        red = deck['A1']['tube_rack']['Red']

        #print("Red Deck {}".format(red.coordinates(deck['A1'])))
        blue = deck['A1']['tube_rack']['Blue']
        #print("Blue Deck {}".format(blue.coordinates(deck['A1'])))
        self.assertEqual(
            my_calibrator.convert(red),
            (13, 18, 3))
        self.assertEqual(
            my_calibrator.convert(blue),
            (24, 19, 4))

    def test_convert(self):
        deck = self.generate_deck()
        calibration_data = {
            'A1':
            {
                'type': 'Slot',
                'delta': (1, 1, 1),
                'children': {
                    'tube_rack': {
                        'type': 'tube-rack-2ml',
                        'delta': (1, 1, 1),
                        'children': {
                            'Red':
                            {
                                'type': 'Well',
                                'delta': (1, 1, 1)
                            },
                            'Blue':
                            {
                                'type': 'Well',
                                'delta': (2, 2, 2)
                            }
                        }
                    }
                }
            }
        }
        my_calibrator = Calibrator(deck, calibration_data)
        res = my_calibrator.convert(
            deck['A1']['tube_rack']['Blue'],
            deck['A1']['tube_rack']['Blue'].center())
        self.assertEqual(res, (29.0, 24.0, 4.0))

        res = my_calibrator.convert(
            deck['A1']['tube_rack'])
        self.assertEqual(res, (7, 12, 2))

    def test_calibrate(self):
        deck = self.generate_deck()
        calibration_data = {}
        my_calibrator = Calibrator(deck, calibration_data)

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
                        'delta': (-1.0, -1.0, -1.0),
                        'type': 'Container'
                    }
                }
            }
        }
        self.assertDictEqual(new_calibration_data, expected_result)

        red = deck['A1']['tube_rack']['Red']
        self.assertEqual(
            my_calibrator.convert(red) + red.center(),
            current_position)
