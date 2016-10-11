from collections import OrderedDict
import json
import unittest

from opentrons_sdk.robot import Robot
from opentrons_sdk.json_ingestor import (
    interpret_deck,
    interpret_head
)


class JSONIngestorTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()

    def test_interpret_deck(self):

        deck_json = """{
            "p200-rack": {
                "labware": "tiprack-200ul",
                "slot" : "A1"
            },
            ".75 mL Tube Rack": {
                "labware": "tube-rack-.75ml",
                "slot" : "C1"
            },
            "trash": {
                "labware": "point",
                "slot" : "B2"
            }
        }"""

        deck_dict = json.loads(deck_json, object_pairs_hook=OrderedDict)

        containers_res = interpret_deck(deck_dict)

        robot_deck = self.robot._deck
        robot_containers = {c.get_name(): c
                            for c in robot_deck.containers()}

        containers_expected = {
            key: {'instance': robot_containers[key]}
            for key in deck_dict.keys()
        }
        self.assertDictEqual(containers_res, containers_expected)

        for name, container_instance in robot_containers.items():
            self.assertEqual(
                robot_deck[deck_dict[name]['slot']][0], container_instance)


    def test_interpret_head(self):
        head_json = """{
            "p200": {
                "tool": "pipette",
                "tip-racks": [
                    {
                        "container": "p200-rack"
                    }
                ],
                "trash-container": {
                    "container": "trash"
                },
                "multi-channel": false,
                "axis": "b",
                "volume": 200,
                "down-plunger-speed": 200,
                "up-plunger-speed": 500,
                "tip-plunge": 6,
                "extra-pull-volume": 0,
                "extra-pull-delay": 200,
                "distribute-percentage": 0.1,
                "points": [
                    {
                        "f1": 1,
                        "f2": 1
                    },
                    {
                        "f1": 5,
                        "f2": 5
                    },
                    {
                        "f1": 7,
                        "f2": 7
                    },
                    {
                        "f1": 10,
                        "f2": 10
                    }
                ]
            }
        }
        """
        head_dict = json.loads(head_json, object_pairs_hook=OrderedDict)

        print([str(i) for i in  head_dict['p200'].keys()])

        head_res = interpret_head(head_dict)


