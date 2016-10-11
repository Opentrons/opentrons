from collections import OrderedDict
import json
import unittest

from opentrons_sdk.robot import Robot
# from opentrons_sdk import containers
from opentrons_sdk.json_ingestor import (
    interpret_deck,
    interpret_head
)


class JSONIngestorTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()

    def load_deck(self):
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
        return (interpret_deck(deck_dict), deck_dict)

    def test_interpret_deck(self):
        containers_res, deck_dict = self.load_deck()

        robot_deck = self.robot._deck
        robot_containers = robot_deck.containers()

        containers_expected = {k: {'instance': v}
                                   for k, v in robot_containers.items()}
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

        robot_deck, _ = self.load_deck()
        head_dict = json.loads(head_json, object_pairs_hook=OrderedDict)
        head_res = interpret_head(robot_deck, head_dict)

        settings = {
            "tip-racks": [
                self.robot._deck.containers()['p200-rack']
            ],
            "trash-container": self.robot._deck.containers()['trash'],
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

        instrument = self.robot._instruments["B"]
        head_expected = {
            'p200': {
                'instance': instrument,
                'settings': settings
            }
        }

        # from pprint import pprint as pp
        #
        # pp(head_expected)
        # print('------')
        # pp(head_res)
        self.assertDictEqual(head_expected, head_res)
        self.assertEqual(1, instrument.channels)
        self.assertEqual(0, instrument.min_volume)
        self.assertEqual(200, instrument.max_volume)
        self.assertEqual('p200', instrument.name)
