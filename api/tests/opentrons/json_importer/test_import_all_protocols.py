from collections import OrderedDict
import json
import os
import unittest

from opentrons import Robot
from opentrons.json_importer import JSONProtocolProcessor


class AllProtocolsTestCase(unittest.TestCase):

    def get_protocol_dir_path(self):
        return os.path.join(
            os.path.dirname(__file__),
            'protocol_data'
        )

    def get_protocols(self):
        for root, dirs, files in os.walk(self.get_protocol_dir_path()):
            for protocol_name in files:
                # Skip README's
                if not protocol_name.lower().endswith('.json'):
                    continue
                try:
                    yield self.read_protocol(root, protocol_name)
                except ValueError:
                    print(
                        'JSON parsing failed for {} ...'.format(
                            os.path.join(root, protocol_name),
                        )
                    )
                    continue

    def read_protocol(self, root, protocol_name):
        protocol_path = os.path.join(root, protocol_name)
        with open(protocol_path) as f:
            protocol_dict = json.load(
                f,
                object_pairs_hook=OrderedDict
            )
        return (protocol_path, protocol_dict)

    def test_all(self):
        failures = []
        for protocol_path, protocol_dict in self.get_protocols():
            Robot.reset_for_tests()
            try:
                jpp = JSONProtocolProcessor(protocol_dict)
                jpp.process()
            except Exception as e:
                failures.append(
                    (protocol_path, e, jpp.errors)
                )
        if failures:
            print('The following protocols failed to parse')
            for path, exc, reason in failures:
                print("[{}]. Reason: {}".format(path, exc))
            assert False
