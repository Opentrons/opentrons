import unittest
import math

from opentrons import containers
from opentrons.util import environment
from opentrons.containers.placeable import (
    Container,
    Well,
    Deck,
    Slot)


class ContainerTestCase(unittest.TestCase):
    def generate_plate(self, wells, cols, spacing, offset, radius):
        c = Container()

        for i in range(0, wells):
            well = Well(properties={'radius': radius})
            row, col = divmod(i, cols)
            name = chr(row + ord('A')) + str(1 + col)
            coordinates = (col * spacing[0] + offset[0],
                           row * spacing[1] + offset[1],
                           0)
            c.add(well, name, coordinates)
        return c

    def test_containers_create(self):
        import os
        import json
        from opentrons import Robot
        container_name = 'plate_for_testing_containers_create'
        containers.create(
            name=container_name,
            grid=(8, 12),
            spacing=(9, 9),
            diameter=4,
            depth=8,
            volume=1000)

        p = containers.load(container_name, 'A1')
        self.assertEquals(len(p), 96)
        self.assertEquals(len(p.rows), 12)
        self.assertEquals(len(p.cols), 8)
        self.assertEquals(
            p.get_parent(), Robot.get_instance().deck['A1'])
        self.assertEquals(p['C3'], p[18])
        self.assertEquals(p['C3'].max_volume(), 1000)
        for i, w in enumerate(p):
            self.assertEquals(w, p[i])

        # remove the file if we only created it for this test
        should_delete = False
        with open(environment.get_path('CONTAINERS_FILE')) as f:
            created_containers = json.load(f)
            del created_containers['containers'][p.get_name()]
            if not len(created_containers['containers'].keys()):
                should_delete = True
        if should_delete:
            os.remove(environment.get_path('CONTAINERS_FILE'))

    def test_containers_list(self):
        res = containers.list()
        self.assertTrue(len(res))

    def test_bad_unpack_containers(self):
        self.assertRaises(
            ValueError, containers.placeable.unpack_location, 1)

    def test_iterate_without_parent(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        self.assertRaises(
            Exception, next, c)

    def test_remove_child(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        c.remove_child('A2')
        self.assertEquals(len(c), 3)

    def test_back_container_getitem(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        self.assertRaises(TypeError, c.__getitem__, (1, 1))

    def test_iterator(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        res = [well.coordinates() for well in c]
        expected = [(0, 0, 0), (5, 0, 0), (0, 5, 0), (5, 5, 0)]

        self.assertListEqual(res, expected)

    def test_next(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        well = c['A1']
        expected = c.get_child_by_name('A2')

        self.assertEqual(next(well), expected)

    def test_int_index(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)

        self.assertEqual(c[3], c.get_child_by_name('B2'))
        self.assertEqual(c[1], c.get_child_by_name('A2'))

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

    def test_get_name(self):
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
            (5.0, 10.0, 0.0))
