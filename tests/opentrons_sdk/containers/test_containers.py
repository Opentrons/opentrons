import unittest

from opentrons_sdk.containers.container import (
    Container,
    Well,
    Deck,
    Slot)


class ContainerTestCase(unittest.TestCase):
    def generate_plate(self, wells, rows, spacing, offset):
        c = Container()

        for i in range(0, wells):
            well = Well()
            row, col = divmod(i, rows)
            name = chr(row + ord('A')) + str(1 + col)
            coordinates = (col * spacing[0] + offset[0],
                           row * spacing[1] + offset[1],
                           0)
            c.add_child(well, name, coordinates)
        return c

    def test_iterator(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0))
        res = [well.get_coordinates() for well in c]
        expected = [(0, 0, 0), (5, 0, 0), (0, 5, 0), (5, 5, 0)]
        self.assertListEqual(res, expected)

    def test_generate_plate(self):
        c = self.generate_plate(
            wells=96,
            rows=8,
            spacing=(10, 15),
            offset=(5, 15)
        )

        self.assertEqual(c['A1'].get_coordinates(), (5, 15, 0))
        self.assertEqual(c['B2'].get_coordinates(), (15, 30, 0))

    def test_get_coordinates(self):
        deck = Deck()
        slot = Slot()
        plate = self.generate_plate(
            wells=96,
            rows=8,
            spacing=(10, 15),
            offset=(5, 15)
        )
        deck.add_child(slot, 'B2', (100, 200, 0))
        slot.add_child(plate)

        self.assertEqual(plate['A1'].get_coordinates(deck), (105, 215, 0))
