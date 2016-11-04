import unittest
import json
from collections import OrderedDict

from opentrons.containers.placeable import Container, Well
from opentrons.containers.persisted_containers import (
    create_container_obj_from_dict,
    get_persisted_container,
    load_all_persisted_containers
)


class PersistedContainersTestCase(unittest.TestCase):
    def test_load_persisted_container(self):
        plate = get_persisted_container("24-plate")
        self.assertIsInstance(plate, Container)

        self.assertIsInstance(plate, Container)

        wells = [well for well in plate]
        self.assertTrue(all([isinstance(i, Well) for i in wells]))

        well_1 = wells[0]
        well_2 = wells[1]

        self.assertEqual(well_1.coordinates(), (13.3 + 0, 17.5 + 0, 0))
        self.assertEqual(well_2.coordinates(), (13.3 + 0, 17.5 + 19.3, 0))

    def test_load_all_persisted_containers(self):
        all_persisted_containers = load_all_persisted_containers()
        self.assertEqual(len(all_persisted_containers), 31)

    def test_create_container_obj_from_dict(self):
        container_data = """{
            "origin-offset":{
                "x":13.3,
                "y":17.5
            },
            "locations":{
                "A1":{
                    "x":0.0,
                    "total-liquid-volume":3400,
                    "y":0.0,
                    "depth":16.2,
                    "z":0,
                    "diameter":15.62
                },
                "A2":{
                    "x":0.0,
                    "total-liquid-volume":3400,
                    "y":19.3,
                    "depth":16.2,
                    "z":0,
                    "diameter":15.62
                }
            }
        }"""

        container_data = json.loads(
            container_data,
            object_pairs_hook=OrderedDict
        )

        res_container = create_container_obj_from_dict(container_data)
        self.assertIsInstance(res_container, Container)
        self.assertEqual(len(res_container), 2)

        wells = [well for well in res_container]
        self.assertTrue(all([isinstance(i, Well) for i in wells]))

        well_1 = wells[0]
        well_2 = wells[1]

        self.assertEqual(well_1.coordinates(), (13.3 + 0, 17.5 + 0, 0))
        self.assertEqual(well_2.coordinates(), (13.3 + 0, 17.5 + 19.3, 0))
