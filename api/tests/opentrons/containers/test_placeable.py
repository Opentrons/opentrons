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
        c.ordering = []
        n_rows = int(wells / cols)
        for i in range(n_rows):
            c.ordering.append([])
        for i in range(0, wells):
            well = Well(properties={'radius': radius, 'height': height})
            row, col = divmod(i, cols)
            name = chr(col + ord('A')) + str(1 + row)
            c.ordering[row].append(name)
            coordinates = (col * spacing[0] + offset[0],
                           row * spacing[1] + offset[1],
                           0)
            c.add(well, name, coordinates)
        return c

    def assertWellSeriesEqual(self, w1, w2):
        if hasattr(w1, '__len__') and hasattr(w2, '__len__'):
            if len(w1) != len(w2):
                print(w1)
                print('lengths: {} and {}'.format(len(w1), len(w2)))
                print(w2)
                assert False
            for i in range(len(w1)):
                if w1[i] != w2[i]:
                    print(w1)
                    print('lengths: {} and {}'.format(len(w1), len(w2)))
                    print(w2)
                    assert False
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

    def test_cycle(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        cycle_iter = c.cycle()
        for n in range(3):
            for i in range(4):
                self.assertEqual(next(cycle_iter), c[i])

    def test_iter_method(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        cycle_iter = c.iter()
        for i in range(4):
            self.assertEqual(next(cycle_iter), c[i])

    def test_chain_method(self):
        a = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        b = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        cycle_iter = a.chain(b, c)
        for i in range(4):
            self.assertEqual(next(cycle_iter), a[i])
        for i in range(4):
            self.assertEqual(next(cycle_iter), b[i])
        for i in range(4):
            self.assertEqual(next(cycle_iter), c[i])

    def test_int_index(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)

        self.assertEqual(c[3], c.get_child_by_name('B2'))
        self.assertEqual(c[1], c.get_child_by_name('B1'))

    def test_add_placeables(self):
        a = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        b = self.generate_plate(4, 2, (5, 5), (0, 0), 5)

        result = a + b
        self.assertEqual(len(result), 8)
        for i in range(len(a)):
            self.assertEqual(a[i], result[i])
        for i in range(len(b)):
            self.assertEqual(b[i], result[i + len(a)])

        result = a.cols(0) + b.rows(0)
        self.assertEqual(len(result), 4)
        self.assertEqual(a[0], result[0])
        self.assertEqual(a[1], result[1])
        self.assertEqual(b[0], result[2])
        self.assertEqual(b[2], result[3])

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

        self.assertEqual(
            plate['A1'].bottom(10, radius=1.0, degrees=90),
            (plate['A1'], Vector(5, 10, 10)))
        self.assertEqual(
            plate['A1'].top(10, radius=1.0, degrees=90),
            (plate['A1'], Vector(5, 10, 20)))

        self.assertEqual(
            plate['A1'].bottom(10, radius=0.5, degrees=270),
            (plate['A1'], Vector(5, 2.5, 10.00)))
        self.assertEqual(
            plate['A1'].top(10, radius=0.5, degrees=270),
            (plate['A1'], Vector(5, 2.5, 20.00)))

    def test_slice_with_strings(self):
        c = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)
        self.assertWellSeriesEqual(c['A1':'A2'], c[0:8])
        self.assertWellSeriesEqual(c['A12':], c.cols[-1][0:])
        self.assertWellSeriesEqual(c.cols['4':'8'], c.cols[3:7])
        self.assertWellSeriesEqual(c.rows['B':'E'], c.rows[1:4])
        self.assertWellSeriesEqual(c.rows['B']['1':'7'], c.rows[1][0:6])

    def test_wells(self):
        c = self.generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)

        self.assertWellSeriesEqual(c.well(0), c[0])
        self.assertWellSeriesEqual(c.well('A2'), c['A2'])
        self.assertWellSeriesEqual(c.wells(0), c[0])
        self.assertWellSeriesEqual(c.wells(), c[0:])

        expected = [c[n] for n in ['A1', 'B2', 'C3']]
        self.assertWellSeriesEqual(c.wells('A1', 'B2', 'C3'), expected)
        self.assertWellSeriesEqual(c.get('A1', 'B2', 'C3'), expected)
        self.assertWellSeriesEqual(c('A1', 'B2', 'C3'), expected)

        expected = [c.rows[0][0], c.rows[0][5]]
        self.assertWellSeriesEqual(c.rows['A'].wells('1', '6'), expected)
        self.assertWellSeriesEqual(c.rows['A'].get('1', '6'), expected)

        expected = [c.rows[0][0], c.rows[0][5]]
        self.assertWellSeriesEqual(c.rows['A'].wells(['1', '6']), expected)
        self.assertWellSeriesEqual(c.rows['A'].get('1', '6'), expected)
        self.assertWellSeriesEqual(c.rows('A').get('1', '6'), expected)

        expected = c.wells('A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1')
        self.assertWellSeriesEqual(c.wells('A1', to='H1'), expected)
        self.assertWellSeriesEqual(c.get('A1', to='H1'), expected)

        expected = c.wells('A1', 'C1', 'E1', 'G1')
        self.assertWellSeriesEqual(c.wells('A1', to='H1', step=2), expected)
        self.assertWellSeriesEqual(c.get('A1', to='H1', step=2), expected)

        expected = c.cols['1':'12':2]
        self.assertWellSeriesEqual(c.cols('1', to='12', step=2), expected)

        expected = c.wells(
            'A3', 'G2', 'E2', 'C2', 'A2', 'G1', 'E1', 'C1', 'A1')
        self.assertWellSeriesEqual(c.wells('A3', to='A1', step=2), expected)
        self.assertWellSeriesEqual(c.get('A3', to='A1', step=2), expected)

        expected = c.wells('A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1')
        self.assertWellSeriesEqual(c.wells('A1', length=8), expected)

        expected = c.wells('A1', 'C1', 'E1', 'G1', 'A2', 'C2', 'E2', 'G2')
        self.assertWellSeriesEqual(c.wells('A1', length=8, step=2), expected)

        expected = c.wells('A1', 'H12', 'G12', 'F12')
        self.assertWellSeriesEqual(c.wells('A1', length=4, step=-1), expected)

        expected = c.wells('A1', 'H12', 'G12', 'F12')
        self.assertWellSeriesEqual(c.wells('A1', length=-4, step=-1), expected)

        expected = c.wells('A1', 'H12', 'G12', 'F12')
        self.assertWellSeriesEqual(c.wells('A1', length=-4, step=1), expected)

        expected = c.wells('A1', 'B1', 'C1', 'D1')
        self.assertWellSeriesEqual(c.wells(length=4), expected)

        self.assertWellSeriesEqual(c.wells(43), c.wells(x=3, y=5))
        self.assertWellSeriesEqual(c.rows(3), c.wells(y=3))
        self.assertWellSeriesEqual(c.cols(4), c.wells(x=4))
        self.assertRaises(ValueError, c.wells, **{'x': '1', 'y': '2'})
