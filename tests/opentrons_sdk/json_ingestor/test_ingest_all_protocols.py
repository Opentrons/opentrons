from collections import OrderedDict
import json
import os
import unittest

from opentrons_sdk.robot import Robot
from opentrons_sdk.json_ingestor import (
    interpret_deck,
    interpret_head,
    interpret_instructions,
    interpret_json_protocol
)



class AllProtocolsTestCase(unittest.TestCase):

    def get_protocol_dir_path(self):
        return os.path.join(
            os.path.dirname(__file__),
            'protocol_data'
        )

    def get_protocols(self):
        for root, dirs, files in os.walk(self.get_protocol_dir_path()):
            for protocol_name in files:
                try:
                    yield self.read_protocol(root, protocol_name)
                except Exception as e:
                    print('Failed to read JSON for {}'.format(root, protocol_name))
                    continue

    def read_protocol(self, root, protocol_name):
        protocol_path = os.path.join(root, protocol_name)
        with open(protocol_path) as f:
            protocol_dict =  json.load(
                f,
                object_pairs_hook=OrderedDict
            )
        return (protocol_path, protocol_dict)

    def test_all(self):
        failures = []
        for protocol_path, protocol_dict in self.get_protocols():
            Robot.reset()
            Robot.get_instance()
            try:
                interpret_json_protocol(protocol_dict)
            except Exception as e:
                failures.append(
                    (protocol_path, str(e))
                )

        if failures:
            print('The following protocols failed to parse')
            for path, reason in failures:
                print("[{}]. Reason: {}".format(path, reason))
            assert False
