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

    def assertWellSeriesEqual(self, w1, w2):
        if hasattr(w1, '__len__') and hasattr(w2, '__len__'):
            if len(w1) != len(w2):
                print(w1)
                print('{} != {}'.format(len(w1), len(w2)))
                print(w2)
                assert False
            for i in range(len(w1)):
                self.assertEquals(w1[i], w2[i])
        else:
            self.assertEquals(w1, w2)

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
        self.assertWellSeriesEqual(c['A1':'A2'], c[0:8])
        self.assertWellSeriesEqual(c['A12':], c.rows[-1][0:])
        self.assertWellSeriesEqual(c.rows['4':'8'], c.rows[3:7])
        self.assertWellSeriesEqual(c.cols['B':'E'], c.cols[1:4])
        self.assertWellSeriesEqual(c.cols['B']['1':'7'], c.cols[1][0:6])

    def test_wells(self):
        c = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)

        self.assertWellSeriesEqual(c.well(0), c[0])
        self.assertWellSeriesEqual(c.well('A2'), c['A2'])
        self.assertWellSeriesEqual(c.wells(0), [c[0]])
        self.assertWellSeriesEqual(c.wells(), c[0:])

        expected = [c[n] for n in ['A1', 'B2', 'C3']]
        self.assertWellSeriesEqual(c.wells('A1', 'B2', 'C3'), expected)

        expected = [c.cols[0][0], c.cols[0][5]]
        self.assertWellSeriesEqual(c.cols['A'].wells('1', '6'), expected)

    def test_range(self):
        c = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)

        self.assertWellSeriesEqual(
            c.range(0, 96),
            c[0:96])
        self.assertWellSeriesEqual(
            c.range(2, 12, 3),
            c[2:12:3])
        self.assertWellSeriesEqual(
            c.range('A3'),
            c[0:16])
        self.assertWellSeriesEqual(
            c.range('A1', 'A3'),
            c['A1':'A3'])
        self.assertWellSeriesEqual(
            c.cols.range('A', 'D'),
            c.cols['A':'D'])
        self.assertWellSeriesEqual(
            c.cols['A'].range('2', '7'),
            c.cols['A']['2':'7'])
        self.assertWellSeriesEqual(
            c.cols.range('A', 'D', 2),
            c.cols['A':'D':2])
        self.assertWellSeriesEqual(
            c.cols['A'].range('2', '7', 2),
            c.cols['A']['2':'7':2])
        self.assertWellSeriesEqual(
            c.cols['A'].range('7', '2', 2),
            c.cols['A'].wells('7', '5', '3'))
        self.assertWellSeriesEqual(
            c.cols['A'].range('7', '2', -2),
            c.cols['A'].wells('7', '5', '3'))

    def test_group(self):
        c = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)

        self.assertWellSeriesEqual(
            c.group('A1', 'H1'),
            c.range('A1', 'A2'))

        self.assertWellSeriesEqual(
            c.group('A1', 'H1', 2),
            c.range('A1', 'A2', 2))

        self.assertWellSeriesEqual(
            c.group('H1', 'B1'),
            c.range('H1', 'A1'))

        self.assertWellSeriesEqual(
            c.group('H1', 'A1', -2),
            c.range('H1', 'A1', -2))

        self.assertWellSeriesEqual(
            c.cols.group('A', 'C'),
            c.cols.range('A', 'D'))

        self.assertWellSeriesEqual(
            c.cols['A'].group('1', '3'),
            c.cols['A'].range('1', '4'))

    def test_chain(self):
        c = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)

        self.assertWellSeriesEqual(
            c.chain('A1', 8),
            c[0:8])

        self.assertWellSeriesEqual(
            c.chain('A3'),
            c['A3':])

        self.assertWellSeriesEqual(
            c.chain('C3', 8),
            c['C3':'C4'])

        self.assertWellSeriesEqual(
            c.chain('C3', 4, -1),
            c.wells('C3', 'B3', 'A3', 'H2'))

        self.assertWellSeriesEqual(
            c.chain('C3', -4),
            c.wells('C3', 'B3', 'A3', 'H2'))

        self.assertWellSeriesEqual(
            c.chain('C3', -4, 2),
            c.wells('C3', 'A3', 'G2', 'E2'))

        self.assertWellSeriesEqual(
            c.chain('B1', -4),
            c.wells('B1', 'A1', 'H12', 'G12'))

        self.assertWellSeriesEqual(
            c.cols.chain('A', 3),
            c.cols.range('A', 'D'))

        self.assertWellSeriesEqual(
            c.cols['A'].chain('1', 3),
            c.cols['A'].range('1', '4'))

        self.assertWellSeriesEqual(
            c.cols['A'].chain('1', 3, 3),
            c.cols['A'].range('1', '8', 3))

        self.assertWellSeriesEqual(
            c.cols['A'].chain('7', -3, 3),
            c.cols['A'].wells('7', '4', '1'))

        self.assertWellSeriesEqual(
            c.cols['A'].chain('4', -3, 3),
            c.cols['A'].wells('4', '1', '10'))

    def test_string_syntax(self):
        plate = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)

        # WELLS

        self.assertWellSeriesEqual(
            plate(),
            plate)

        self.assertWellSeriesEqual(
            plate('A1'),
            [plate['A1']])

        self.assertWellSeriesEqual(
            plate('A1', 'B3', 'C8'),
            plate.wells('A1', 'B3', 'C8'))

        # CHAIN ~

        self.assertWellSeriesEqual(
            plate.chain('A1', -8),
            plate('A1~-8'))

        self.assertWellSeriesEqual(
            plate.chain('A2'),
            plate('A2~'))

        self.assertWellSeriesEqual(
            plate.chain('A2', 3, 3),
            plate('A2~3', 3))

        self.assertWellSeriesEqual(
            plate.chain('A2', 3, -3),
            plate('A2~-3', -3))

        # GROUP -

        self.assertWellSeriesEqual(
            plate.group('C1', 'H8'),
            plate('C1-H8'))

        self.assertWellSeriesEqual(
            plate.group(2, 1),
            plate('C1-B1'))

        self.assertWellSeriesEqual(
            plate.group('A1', 'H1'),
            plate('A1-H1'))

        self.assertWellSeriesEqual(
            plate.group('A1', 'H1', 2),
            plate('A1-H1', 2))
