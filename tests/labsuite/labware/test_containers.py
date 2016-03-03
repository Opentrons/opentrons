import unittest

from labsuite.labware import containers, microplates, tipracks

import yaml

class ContainerTest(unittest.TestCase):

    def assertIs(self, thing, comparison):
        self.assertTrue(issubclass(thing, comparison))

    def test_custom_container_type(self):
        """
        Enforce valid custom container type.
        """
        with self.assertRaises(KeyError):
            containers.add_custom_container({'type':'imaginary'})

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
            containers.add_custom_container({'fake_key':True})

    def test_custom_container_value_method(self):
        """ 
        Reject unsupported property types.
        """
        with self.assertRaises(ValueError):
            def fun():
                print(":)")
            containers.add_custom_container({'well_depth': fun})

    def test_microplate(self):
        """
        Provide access to microplates.
        """
        plate = containers.load_container('microplate')
        self.assertIs(plate, microplates.Microplate)

    def test_microplate_subset(self):
        """
        Provide access to child microplates.
        """
        plate = containers.load_container('microplate.96')
        self.assertIs(plate, microplates.Microplate)

    def test_microplate_subsubset(self):
        """
        Provide access to subchild microplates.
        """
        plate = containers.load_container('microplate.96.deepwell')
        self.assertIs(plate, microplates.Microplate_96_Deepwell)

    def test_tiprack(self):
        """
        Provide access to tipracks.
        """
        rack = containers.load_container('tiprack')
        self.assertIs(rack, tipracks.Tiprack)

    def test_custom_container(self):
        """
        Provide a custom container interface.
        """
        # Example definition lives in config/containers/example.yml
        plate = containers.load_container('microplate.example_plate')
        self.assertIs(plate, microplates.Microplate)
        self.assertEqual(plate.rows, 12)
        self.assertEqual(plate.cols, 8)
        self.assertEqual(plate.a1_x, 10)
        self.assertEqual(plate.a1_y, 11)
        self.assertEqual(plate.diameter, 7)

    def test_custom_container_subset(self):
        """
        Custom container subsets inherit parent values.
        """
        plate = containers.load_container('microplate.example_plate.deepwell')
        self.assertEqual(plate.depth, 15)
        self.assertEqual(plate.rows, 12)
        self.assertEqual(plate.cols, 8)
        self.assertEqual(plate.a1_x, 10)
        self.assertEqual(plate.a1_y, 11)

    def test_custom_tiprack(self):
        """
        Custom container should inherit from Tiprack type.
        """
        rack = containers.load_container('tiprack.example_rack')
        self.assertIs(rack, tipracks.Tiprack)

    def test_static_coordinates(self):
        """ 
        Containers should calculate coordinates statically.
        """
        # Microplate has spacing as row: 12, col: 12.
        plate  = containers.load_container('microplate.example_plate')
        coords = plate.calculate_offset('b12')
        self.assertEqual(coords, (12*1, 12*11, 0)) 

    def test_static_coordinates_custom_x_y_spacing(self):
        """
        Custom row, col spacing should supercede spacing.
        """
        # Deepwell has spacing as col: 10, row: 13
        plate = containers.load_container('microplate.example_plate.deepwell')
        coords = plate.calculate_offset('b12')
        print(plate.col_spacing, plate.row_spacing)
        self.assertEqual(coords, (10, 13*11, 0))

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
        self.assertEqual(plate.depth, 25)

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
        result = yaml.load(containers.legacy_json_to_yaml(data))

        expected['spacing'] = 0
        result['well_depth'] = result.pop('depth')

        self.assertDictEqual(result, expected)

    def test_stock_containers_valid(self):
        """
        All stock containers are backwards compatible.
        """
        for n in containers.list_containers():
            containers.generate_legacy_container(n)

    def test_custom_container_volume(self):
        """
        Custom containers can specify custom volume.
        """
        rack = containers.load_container('tuberack.750ul')
        self.assertEqual(rack.volume, 750)

    def test_legacy_container_load(self):
        """
        All legacy containers load.
        """
        containers.load_legacy_containers_file()
        containers.load_container('legacy.tube-rack-2ml_PCR')

    def test_custom_well_positions(self):
        """
        Custom well positions.
        """
        rack = containers.load_container('tuberack.15-50ml')
 
        # Values taken from legacy containers.json file.
        self.assertEqual(rack.coordinates('A1'), (0, 0, 0))
        self.assertEqual(rack.coordinates('A3'), (10, 50, 0))
        self.assertEqual(rack.coordinates('B1'), (32, 0, 0))
        self.assertEqual(rack.coordinates('B2'), (32, 24, 0))
        self.assertEqual(rack.coordinates('B3'), (55, 50, 0))
        self.assertEqual(rack.coordinates('C1'), (64, 0, 0))
        self.assertEqual(rack.coordinates('C2'), (64, 24, 0))
        
    def test_custom_well_properties(self):
        """
        Custom well properties.
        """
        rack = containers.load_container('tuberack.15-50ml')()

        self.assertEqual(rack.volume, 15000)  # Default volume.
 
        self.assertEqual(rack.tube('A1').max_volume, 15000)
        self.assertEqual(rack.tube('B3').max_volume, 50000)
        
        self.assertEqual(rack.tube('A1').depth, 76)
        self.assertEqual(rack.tube('A3').depth, 76)
        self.assertEqual(rack.tube('A1').diameter, 16)
        self.assertEqual(rack.tube('A3').diameter, 26)

    def test_tiprack_next_tip(self):
        """
        Tip offset.
        """
        rack = containers.load_container('tiprack.1000ul')

        a1 = rack.tip_offset()
        a2 = rack.tip_offset(1)
        a3 = rack.tip_offset(2)
        a4 = rack.tip_offset(3)
        b1 = rack.tip_offset(8)
        b3 = rack.tip_offset(10)

        self.assertEqual(a1, rack.coordinates('a1'))
        self.assertEqual(a2, rack.coordinates('a2'))
        self.assertEqual(a3, rack.coordinates('a3'))
        self.assertEqual(a4, rack.coordinates('a4'))
        self.assertEqual(b1, rack.coordinates('b1'))
        self.assertEqual(b3, rack.coordinates('b3'))

    def test_tiprack_tag(self):
        """
        Tips on specific racks can be tagged for reuse.
        """
        rack = containers.load_container('tiprack.1000ul')()
        
        a1 = rack.get_next_tip().coordinates()
        a2 = rack.get_next_tip().coordinates()
        a3 = rack.get_next_tip().coordinates()

        a4 = rack.get_next_tip(tag='water').coordinates()
        a5 = rack.get_next_tip(tag='saline').coordinates()

        also_a4 = rack.get_next_tip(tag='water').coordinates()
        also_a5 = rack.get_next_tip('saline').coordinates()

        self.assertEqual(a1, rack.coordinates('a1'))
        self.assertEqual(a2, rack.coordinates('a2'))
        self.assertEqual(a3, rack.coordinates('a3'))
        self.assertEqual(a4, rack.coordinates('a4'))
        self.assertEqual(a5, rack.coordinates('a5'))
        self.assertEqual(also_a4, rack.coordinates('a4'))
        self.assertEqual(also_a5, rack.coordinates('a5'))

