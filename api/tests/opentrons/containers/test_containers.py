import math
import unittest

from opentrons.data_storage import database
from opentrons.containers import (
    create as containers_create,
    load as containers_load,
    list as containers_list
)
from opentrons import Robot
from opentrons.containers import placeable
from opentrons.containers.placeable import (
    Container,
    Well,
    Deck,
    Slot)


def test_containers_create(robot):
    container_name = 'plate_for_testing_containers_create'
    containers_create(
        name=container_name,
        grid=(8, 12),
        spacing=(9, 9),
        diameter=4,
        depth=8,
        volume=1000,
        save=True)

    p = containers_load(robot, container_name, 'A1')
    assert len(p) == 96
    assert len(p.rows) == 12
    assert len(p.cols) == 8
    assert p.get_parent() == robot.deck['1']
    assert p['C3'] == p[18]
    assert p['C3'].max_volume() == 1000
    for i, w in enumerate(p):
        assert w == p[i]

    assert container_name in containers_list()

    database.delete_container(container_name)
    assert container_name not in containers_list()


class ContainerTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()

    def tearDown(self):
        del self.robot

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

    def test_load_same_slot_force(self):
        container_name = '96-flat'
        slot = 'A1'
        containers_load(self.robot, container_name, slot)
        self.assertEquals(len(self.robot.get_containers()), 1)

        self.assertRaises(
            RuntimeWarning, containers_load,
            self.robot, container_name, slot)
        self.assertRaises(
            RuntimeWarning, containers_load,
            self.robot, container_name, slot, share=True)
        self.assertRaises(
            RuntimeWarning, containers_load,
            self.robot, container_name, slot, 'custom-name')
        self.assertRaises(
            RuntimeWarning, containers_load,
            self.robot, 'trough-12row', slot)
        self.assertRaises(
            RuntimeWarning, containers_load,
            self.robot, 'trough-12row', slot, 'custom-name')

        containers_load(
            self.robot, container_name, slot, 'custom-name', share=True)
        self.assertEquals(len(self.robot.get_containers()), 2)

        containers_load(
            self.robot, 'trough-12row', slot, share=True)
        self.assertEquals(len(self.robot.get_containers()), 3)

    def test_containers_list(self):
        res = containers_list()
        self.assertTrue(len(res))

    def test_bad_unpack_containers(self):
        self.assertRaises(
            ValueError, placeable.unpack_location, 1)

    def test_iterate_without_parent(self):
        c = self.generate_plate(4, 2, (5, 5), (0, 0), 5)
        self.assertRaises(
            Exception, next, c)

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
