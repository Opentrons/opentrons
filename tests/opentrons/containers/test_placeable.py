import unittest
import math

from opentrons.containers.placeable import (
    Container,
    Well,
    Deck,
    Slot)
from opentrons.util.vector import Vector


class PlaceableTestCase(unittest.TestCase):
    def generate_plate(self, wells, cols, spacing, offset, radius, height=0):
        c = Container()

        for i in range(0, wells):
            well = Well(properties={'radius': radius, 'height': height})
            row, col = divmod(i, cols)
            name = chr(col + ord('A')) + str(1 + row)
            coordinates = (col * spacing[0] + offset[0],
                           row * spacing[1] + offset[1],
                           0)
            c.add(well, name, coordinates)
        return c

    def test_get_name(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        expected = '<Well A1>'
        self.assertEqual(str(c['A1']), expected)
        expected = '<Container>'
        self.assertEqual(str(c), expected)

    def test_iterator(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        res = [well.coordinates() for well in c]
        expected = [(0, 0, 0), (5, 0, 0), (0, 5, 0), (5, 5, 0)]

        self.assertListEqual(res, expected)

    def test_next(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        well = c['A1']
        expected = c.get_child_by_name('B1')

        self.assertEqual(next(well), expected)

    def test_int_index(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)

        self.assertEqual(c[3], c.get_child_by_name('B2'))
        self.assertEqual(c[1], c.get_child_by_name('B1'))

    def test_named_well(self):
        deck = Deck()
        slot = Slot()
        c = Container()
        deck.add(slot, 'A1', (0, 0, 0))
        red = Well(properties={'radius': 5})
        blue = Well(properties={'radius': 5})
        c.add(red, "Red", (0, 0, 0))
        c.add(blue, "Blue", (10, 0, 0))
        slot.add(c)

        self.assertEqual(deck['A1'][0]['Red'], red)

    def test_generate_plate(self):
        c = self.generate_plate(
            wells=96,
            cols=8,
            spacing=(10, 15),
            offset=(5, 15),
            radius=5
        )

        self.assertEqual(c['A1'].coordinates(), (5, 15, 0))
        self.assertEqual(c['B2'].coordinates(), (15, 30, 0))

    def test_coordinates(self):
        deck = Deck()
        slot = Slot()
        plate = self.generate_plate(
            wells=96,
            cols=8,
            spacing=(10, 15),
            offset=(5, 15),
            radius=5
        )
        deck.add(slot, 'B2', (100, 200, 0))
        slot.add(plate)

        self.assertEqual(plate['A1'].coordinates(deck), (105, 215, 0))

    def test_get_container_name(self):
        deck = Deck()
        slot = Slot()
        c = Container()
        deck.add(slot, 'A1', (0, 0, 0))
        red = Well(properties={'radius': 5})
        blue = Well(properties={'radius': 5})
        c.add(red, "Red", (0, 0, 0))
        c.add(blue, "Blue", (10, 0, 0))
        slot.add(c)

        self.assertEqual(red.get_name(), 'Red')

    def test_well_from_center(self):
        deck = Deck()
        slot = Slot()
        plate = self.generate_plate(
            wells=4,
            cols=2,
            spacing=(10, 10),
            offset=(0, 0),
            radius=5
        )
        deck.add(slot, 'A1', (0, 0, 0))
        slot.add(plate)

        self.assertEqual(
            plate['B2'].center(),
            (5, 5, 0))
        self.assertEqual(
            plate['B2'].from_center(x=0.0, y=0.0, z=0.0),
            (5, 5, 0))
        self.assertEqual(
            plate['B2'].from_center(r=1.0, theta=math.pi / 2, h=0.0),
            (5.0, 10.0, 0))

    def test_get_all_children(self):
        c1 = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        c2 = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        deck = Deck()
        deck.add(c1, "A1", (0, 0, 0))
        deck.add(c2, "A2", (50, 50, 50))
        self.assertEqual(len(deck.get_all_children()), 10)

    def test_max_dimensions(self):
        c1 = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        c2 = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        deck = Deck()
        deck.add(c1, "A1", (0, 0, 0))
        deck.add(c2, "A2", (50, 50, 50))

        actual = deck.max_dimensions(deck)
        expected = (65.0, 65.0, 50.0)
        self.assertEqual(actual, expected)

    def test_top_bottom(self):
        deck = Deck()
        slot = Slot()
        plate = self.generate_plate(
            wells=4,
            cols=2,
            spacing=(10, 10),
            offset=(0, 0),
            radius=5,
            height=10
        )
        deck.add(slot, 'A1', (0, 0, 0))
        slot.add(plate)

        self.assertEqual(
            plate['A1'].bottom(10),
            (plate['A1'], Vector(5, 5, 10)))
        self.assertEqual(
            plate['A1'].top(10),
            (plate['A1'], Vector(5, 5, 20)))

    def test_slice_with_strings(self):
        c = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)
        self.assertListEqual(c['A1':'A2'], c[0:8])
        self.assertListEqual(c['A12':], c.rows[-1][0:])
        self.assertListEqual(c.rows['4':'8'], c.rows[3:7])
        self.assertListEqual(c.cols['B':'E'], c.cols[1:4])
        self.assertListEqual(c.cols['B']['1':'7'], c.cols[1][0:6])
