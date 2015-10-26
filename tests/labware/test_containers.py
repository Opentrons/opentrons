import unittest
from labware import containers
import labware

import yaml

class ContainerTest(unittest.TestCase):

    def assertIs(self, thing, comparison):
        self.assertTrue(issubclass(thing, comparison))

    def test_custom_container_type(self):
        """
        Enforce valid custom container type.
        """
        with self.assertRaises(KeyError):
            containers.add_custom_container('foo', {'type':'imaginary'})

    def test_invaid_container_name(self):
        """
        Enforce valid container name.
        """
        with self.assertRaises(KeyError):
            containers.load_container('fake_container')

    def test_custom_container_property(self):
        """
        Reject unknown properties.
        """
        with self.assertRaises(KeyError):
            containers.add_custom_container('foo', {'fake_key':True})

    def test_custom_container_value_method(self):
        """ 
        Reject unsupported property types.
        """
        with self.assertRaises(ValueError):
            def fun():
                print(":)")
            containers.add_custom_container('foo', {'well_depth': fun})

    def test_microplate(self):
        """
        Provide access to microplates.
        """
        plate = containers.load_container('microplate')
        self.assertIs(plate, labware.Microplate)

    def test_microplate_subset(self):
        """
        Provide access to child microplates.
        """
        plate = containers.load_container('microplate.96')
        self.assertIs(plate, labware.microplates.Microplate_96)

    def test_microplate_subsubset(self):
        """
        Provide access to subchild microplates.
        """
        plate = containers.load_container('microplate.96.deepwell')
        self.assertIs(plate, labware.microplates.Microplate_96_Deepwell)

    def test_tiprack(self):
        """
        Provide access to tipracks.
        """
        rack = containers.load_container('tiprack')
        self.assertIs(rack, labware.Tiprack)

    def test_custom_container(self):
        """
        Provide a custom container interface.
        """
        # Example definition lives in config/containers/example.yml
        plate = containers.load_container('microplate.example_plate')
        self.assertIs(plate, labware.Microplate)
        self.assertTrue(plate.rows is 12)
        self.assertTrue(plate.cols is 8)
        self.assertTrue(plate.a1_x is 10)
        self.assertTrue(plate.a1_y is 11)
        self.assertTrue(plate.diameter is 7)

    def test_custom_container_subset(self):
        """
        Custom container subsets inherit parent values.
        """
        plate = containers.load_container('microplate.example_plate.deepwell')
        self.assertTrue(plate.well_depth is 15)
        self.assertTrue(plate.rows is 12)
        self.assertTrue(plate.cols is 8)
        self.assertTrue(plate.a1_x is 10)
        self.assertTrue(plate.a1_y is 11)

    def test_custom_tiprack(self):
        """
        Custom container should inherit from Tiprack type.
        """
        rack = containers.load_container('tiprack.example_rack')
        self.assertIs(rack, labware.Tiprack)

    def test_static_coordinates(self):
        """ 
        Containers should calculate coordinates statically.
        """
        # Microplate has spacing as row: 12, col: 12.
        plate  = containers.load_container('microplate.example_plate')
        coords = plate.calculate_offset('b12')
        self.assertEqual(coords, (12*1, 12*11)) 

    def test_static_coordinates_custom_x_y_spacing(self):
        """
        Custom row, col spacing should supercede spacing.
        """
        # Deepwell has spacing as col: 10, row: 13
        plate = containers.load_container('microplate.example_plate.deepwell')
        coords = plate.calculate_offset('b12')
        print(plate.col_spacing, plate.row_spacing)
        self.assertEqual(coords, (10, 13*11))

    def test_instance_coordinates_custom_x_y_spacing(self):
        """
        Custom row, col spacing should supercede spacing.
        """
        # Deepwell has spacing as col: 10, row: 13
        plate = containers.load_container('microplate.example_plate.deepwell')
        coords = plate().get_child_coordinates('b12')
        self.assertEqual(coords, (10, 13*11, 0))

    def test_list_microplates(self):
        """
        Container list includes microplates.
        """
        inv = containers.list_containers()
        self.assertTrue('microplate' in inv)
        self.assertTrue('microplate.96' in inv)
        self.assertTrue('microplate.96.deepwell' in inv)

    def test_list_example_plate(self):
        """
        Container list includes custom example.
        """
        inv = containers.list_containers()
        self.assertTrue('microplate.example_plate' in inv)
        self.assertTrue('microplate.example_plate.deepwell' in inv)

    def test_list_example_plate(self):
        """
        Custom container subset recursion.
        """
        inv = containers.list_containers()
        self.assertTrue('microplate.example_plate.deepwell.red' in inv)
        plate = containers.load_container('microplate.example_plate.deepwell.red')
        self.assertTrue(plate.well_depth is 25)

    def test_tiprack_defaults(self):
        """
        Container list includes tipracks.
        """
        inv = containers.list_containers()
        self.assertTrue('tiprack' in inv)
        self.assertTrue('tiprack.p10' in inv)
        self.assertTrue('tiprack.p20' in inv)
        self.assertTrue('tiprack.p200' in inv)
        self.assertTrue('tiprack.p1000' in inv)

    def test_24_well_microplate(self):
        """
        24 well microplate should exist.
        """
        plate = containers.load_container('microplate.24')
        self.assertEqual(plate.rows*plate.cols, 24)

    def test_convert_legacy_containers(self):
        """
        Container from old data structure converted to new one.
        """

        data = {
            "24-plate":{
                "origin-offset":{
                    "x":13,
                    "y":14.5
                },
                "locations":{
                    "A1":{"x":0, "total-liquid-volume":3400, "y":0.0, "depth":16.2, "z":0, "diameter":15.62 },
                    "A2":{"x":0, "total-liquid-volume":3400, "y":10, "depth":16.2, "z":0, "diameter":15.62 },
                    "A3":{"x":0.0, "total-liquid-volume":3400, "y":20, "depth":16.2, "z":0, "diameter":15.62 },
                    "B1":{"x":12, "total-liquid-volume":3400, "y":0, "depth":16.2, "z":0, "diameter":15.62 },
                    "B2":{"x":12, "total-liquid-volume":3400, "y":10, "depth":16.2, "z":0, "diameter":15.62 },
                    "B3":{"x":12, "total-liquid-volume":3400, "y":20, "depth":16.2, "z":0, "diameter":15.62 },
                    "C1": {"x":24, "total-liquid-volume":3400, "y":0, "depth":16.2, "z":0, "diameter":15.62 },
                    "C2": {"x":24, "total-liquid-volume":3400, "y":10, "depth":16.2, "z":0, "diameter":15.62 },
                    "C3": {"x":24, "total-liquid-volume":3400, "y":20, "depth":16.2, "z":0, "diameter":15.62 },
                }
            }
        }

        result = containers.convert_legacy_container(data['24-plate'])

        expected = {
            'diameter': 15.62,
            'well_depth': 16.2,
            'cols': 3,
            'rows': 3,
            'height': 16.2,
            'a1_y': 14.5,
            'a1_x': 13,
            'row_spacing': 10,
            'col_spacing': 12,
            'volume': 3400
        }

        self.assertDictEqual(result, expected)

        # Make sure the YAML works, too.
        result = containers.convert_legacy_containers(data)
        expected['legacy_name'] = '24-plate'
        self.assertDictEqual(yaml.load(result), expected)
