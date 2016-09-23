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
            c.add(well, name, coordinates)
        return c

    def test_iterator(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0))
        res = [well.coordinates() for well in c]
        expected = [(0, 0, 0), (5, 0, 0), (0, 5, 0), (5, 5, 0)]

        self.assertListEqual(res, expected)

    def test_next(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0))
        well = c['A1']
        expected = c.get_child_by_name('A2')

        self.assertEqual(next(well), expected)

    def test_int_index(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0))

        self.assertEqual(c[3], c.get_child_by_name('B2'))
        self.assertEqual(c[1], c.get_child_by_name('A2'))

    def test_generate_plate(self):
        c = self.generate_plate(
            wells=96,
            rows=8,
            spacing=(10, 15),
            offset=(5, 15)
        )

        self.assertEqual(c['A1'].coordinates(), (5, 15, 0))
        self.assertEqual(c['B2'].coordinates(), (15, 30, 0))

    def test_coordinates(self):
        deck = Deck()
        slot = Slot()
        plate = self.generate_plate(
            wells=96,
            rows=8,
            spacing=(10, 15),
            offset=(5, 15)
        )
        deck.add(slot, 'B2', (100, 200, 0))
        slot.add(plate)

        self.assertEqual(plate['A1'].coordinates(deck), (105, 215, 0))
