from collections import OrderedDict
import json
import unittest
from unittest import mock

from opentrons import Robot
from opentrons.json_importer import (
    JSONProtocolProcessor,
    JSONProcessorRuntimeError,
    JSONProcessorValidationError
)


def get_name_from_closure(ftn):
    return ftn.__qualname__.split('.')[1]


class JSONIngestorTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot.get_instance()
        self.robot.connect()
        self.protocol = None

    def get_protocol(self):
        protocol = """{
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
            },
            "head": {
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
            },
            "instructions": [
                {
                    "tool": "p200",
                    "groups": [
                        {
                            "transfer": [
                                {
                                    "from": {
                                        "container": ".75 mL Tube Rack",
                                        "location": "A1",
                                        "tip-offset": 0,
                                        "delay": 0,
                                        "liquid-tracking": false
                                    },
                                    "to": {
                                        "container": ".75 mL Tube Rack",
                                        "location": "C1",
                                        "liquid-tracking": false,
                                        "touch-tip": false
                                    },
                                    "volume": 200,
                                    "blowout": true
                                },
                                {
                                    "from": {
                                        "container": ".75 mL Tube Rack",
                                        "location": "A1",
                                        "tip-offset": 0,
                                        "delay": 0,
                                        "liquid-tracking": false
                                    },
                                    "to": {
                                        "container": ".75 mL Tube Rack",
                                        "location": "C1",
                                        "liquid-tracking": false,
                                        "touch-tip": false
                                    },
                                    "volume": 97,
                                    "blowout": true
                                }
                            ]
                        }
                    ]
                }
            ]
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

    def test_process_head(self):
        protocol = self.get_protocol()
        jpp = JSONProtocolProcessor(protocol)
        jpp.process_deck()
        jpp.process_head()

        expected_settings = {
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
                'settings': expected_settings
            }
        }

        self.assertDictEqual(head_expected, jpp.head)
        self.assertEqual(1, instrument.channels)
        self.assertEqual(0, instrument.min_volume)
        self.assertEqual(200, instrument.max_volume)
        self.assertEqual('p200', instrument.name)

    def test_process_command(self):
        jpp = JSONProtocolProcessor(self.get_protocol())
        jpp.handle_consolidate = mock.Mock()
        jpp.handle_distribute = mock.Mock()
        jpp.handle_transfer = mock.Mock()
        jpp.handle_mix = mock.Mock()

        for cmd in ['consolidate', 'distribute', 'mix', 'transfer']:
            jpp.process_command(None, cmd, None)

        for cmd in ['consolidate', 'distribute', 'mix', 'transfer']:
            getattr(jpp, "handle_{}".format(cmd), mock.Mock()).called

        with self.assertRaises(JSONProcessorRuntimeError):
            jpp.process_command(None, 'foo', None)

    def test_validate_protocol(self):
        protocol = self.get_protocol()
        jpp = JSONProtocolProcessor(protocol)
        jpp.validate()
        self.assertEqual(jpp.errors, [])
        self.assertEqual(
            jpp.warnings,
            ['JSON Protocol section "Ingredients" will not be used']
        )

        protocol = self.get_protocol()
        jpp = JSONProtocolProcessor(protocol)
        del jpp.protocol['head']
        self.assertRaises(JSONProcessorValidationError, jpp.validate)

        protocol = self.get_protocol()
        jpp = JSONProtocolProcessor(protocol)
        del jpp.protocol['deck']
        self.assertRaises(JSONProcessorValidationError, jpp.validate)

        protocol = self.get_protocol()
        jpp = JSONProtocolProcessor(protocol)
        del jpp.protocol['instructions']
        self.assertRaises(JSONProcessorValidationError, jpp.validate)

    def test_process_instructions(self):
        protocol = self.get_protocol()
        jpp = JSONProtocolProcessor(protocol)
        jpp.process_deck()
        jpp.process_head()
        jpp.process_instructions()

        api_calls = [
            get_name_from_closure(cmd.do)
            for cmd in self.robot._commands
        ]
        api_calls_expected = [
            'pick_up_tip',
            'aspirate',
            'dispense',
            'delay',
            'aspirate',
            'dispense',
            'delay',
            'drop_tip'
        ]

        self.assertEqual(api_calls, api_calls_expected)

        # self.robot.run()

        instrument = self.robot._instruments["B"]
        wells_referenced = [
            (i.get_parent().get_name(), i.get_name())
            for i in instrument.placeables
        ]
        wells_referenced_expected = [
            ('p200-rack', 'A1'),  # Location of first tip in tiprack
            ('.75 mL Tube Rack', 'A1'),  # 1st transfer
            ('.75 mL Tube Rack', 'C1'),  # 1st transfer
            ('.75 mL Tube Rack', 'A1'),  # 2nd transfer
            ('.75 mL Tube Rack', 'C1'),  # 2nd transfer
            ('trash', 'A1')  # Location of tiprack in trash
        ]
        self.assertEqual(wells_referenced, wells_referenced_expected)
