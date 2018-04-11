from collections import OrderedDict
import json
import os
import shutil
import unittest

from opentrons.data_storage import old_container_loading
from opentrons.containers.placeable import Container, Well
from opentrons.util import environment
from opentrons.config import feature_flags as ff


if not ff.split_labware_definitions():
    class PersistedContainersTestCase(unittest.TestCase):
        @classmethod
        def setUpClass(cls):
            # here we are copying containers from data and
            # re-defining APP_DATA_DIR. This way we can
            # load a few more custom containers
            old_container_loading.persisted_containers_dict.clear()
            os.environ['APP_DATA_DIR'] = os.path.join(
                os.path.dirname(__file__),
                'opentrons-data')
            environment.refresh()

            source = os.path.join(
                os.path.dirname(__file__),
                'data'
            )

            containers_dir = environment.get_path('CONTAINERS_DIR')
            shutil.rmtree(containers_dir)
            shutil.copytree(source, containers_dir)

        @classmethod
        def tearDownClass(cls):
            shutil.rmtree(environment.get_path('APP_DATA_DIR'))
            del os.environ['APP_DATA_DIR']
            environment.refresh()

        def test_get_custom_container_files(self):
            old_container_loading.get_custom_container_files()

        def test_load_all_containers(self):
            old_container_loading.load_all_containers_from_disk()
            old_container_loading.get_persisted_container("24-vial-rack")
            old_container_loading.get_persisted_container("container-1")
            old_container_loading.get_persisted_container("container-2")

            # Skip container-3 is defined in .secret/containers-3.json.
            with self.assertRaisesRegexp(
                ValueError,
                'Container type "container-3" not found in files: .*'
            ):
                old_container_loading.get_persisted_container("container-3")

            # Skip container-4 is defined in .containers-4.json.
            with self.assertRaisesRegexp(
                ValueError,
                'Container type "container-4" not found in files: .*'
            ):
                old_container_loading.get_persisted_container("container-4")

        def test_load_persisted_container(self):
            plate = old_container_loading.get_persisted_container(
                "24-vial-rack")
            self.assertIsInstance(plate, Container)

            self.assertIsInstance(plate, Container)

            wells = [well for well in plate]
            self.assertTrue(all([isinstance(i, Well) for i in wells]))

            well_1 = wells[0]
            well_2 = wells[1]

            self.assertEqual(well_1.coordinates(), (5.86 + 0, 8.19 + 0, 0))
            self.assertEqual(well_2.coordinates(), (5.86 + 0, 8.19 + 19.3, 0))

        def test_load_all_persisted_containers(self):
            all_persisted_containers = \
                old_container_loading.load_all_containers()
            self.assertEqual(len(all_persisted_containers), 46)

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

            res_container = \
                old_container_loading.create_container_obj_from_dict(
                    container_data)
            self.assertIsInstance(res_container, Container)
            self.assertEqual(len(res_container), 2)

            wells = [well for well in res_container]
            self.assertTrue(all([isinstance(i, Well) for i in wells]))

            well_1 = wells[0]
            well_2 = wells[1]

            self.assertEqual(well_1.coordinates(), (5.49 + 0, 9.69 + 0, 0))
            self.assertEqual(well_2.coordinates(), (5.49 + 0, 9.69 + 19.3, 0))
