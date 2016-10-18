from collections import OrderedDict
import json
import unittest

from opentrons_sdk.robot import Robot
from opentrons_sdk.json_ingestor import JSONProtocolProcessor


class JSONIngestorTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()
        self.protocol = None

    def get_protocol(self):
        protocol =  """{
            "deck": {
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
            }
        }"""
        return json.loads(protocol, object_pairs_hook=OrderedDict)

    def test_deck(self):
        protocol = self.get_protocol()
        deck_dict = protocol['deck']
        jpp = JSONProtocolProcessor(protocol)
        jpp.process_deck()

        robot_deck = self.robot._deck
        robot_containers = robot_deck.containers()

        deck_expected = {k: {'instance': v}
                         for k, v in robot_containers.items()}
        self.assertDictEqual(jpp.deck, deck_expected)

        for name, container_instance in robot_containers.items():
            self.assertEqual(
                robot_deck[deck_dict[name]['slot']][0], container_instance)
