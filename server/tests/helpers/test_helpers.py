import unittest
import os

from opentrons_sdk.robot import Robot

from server import helpers


class LoadJSONTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot.get_instance()
        self.robot.connect()

    def get_json_protocol_stream(self, name):
        return open(
            os.path.join(os.path.dirname(__file__), '..', 'data', name),
            'rb'
        )

    def get_good_json_protocol_stream(self):
        return self.get_json_protocol_stream('good_json_protocol.json')

    def get_bad_json_protocol_stream(self):
        return self.get_json_protocol_stream('bad_json_protocol.json')

    def get_invalid_json_protocol_stream(self):
        return self.get_json_protocol_stream('invalid_json_protocol.json')

    def test_load_json_with_good_protocol(self):
        stream = self.get_good_json_protocol_stream()
        api_resp_result = helpers.load_json(stream)
        api_resp_expected = {'error': [], 'warnings': []}
        self.assertDictEqual(api_resp_expected, api_resp_result)

    def test_load_json_with_bad_protocol(self):
        stream = self.get_bad_json_protocol_stream()
        api_resp_result = helpers.load_json(stream)
        self.assertEqual(len(api_resp_result['error']), 2)
        self.assertEqual(len(api_resp_result['warnings']), 0)

    def test_load_json_with_invalid_protocol(self):
        stream = self.get_invalid_json_protocol_stream()
        api_resp_result = helpers.load_json(stream)
        self.assertEqual(len(api_resp_result['error']), 2)
        self.assertEqual(len(api_resp_result['warnings']), 0)
