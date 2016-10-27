import io
import unittest
import os

from opentrons.robot import Robot

from server import helpers


class MiscHelpersTestCase(unittest.TestCase):
    def test_convert_bytes_stream_to_str(self):
        text = ['line 1', 'line 2', 'foo bar']
        bytes_stream = io.BytesIO()
        [bytes_stream.write(i.encode()) for i in text]
        bytes_stream.seek(0)
        text_res = helpers.convert_byte_stream_to_str(bytes_stream)
        self.assertEqual(''.join(text), text_res)


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
        api_resp_expected = {'errors': [], 'warnings': []}
        self.assertDictEqual(api_resp_expected, api_resp_result)

    def test_load_json_with_bad_protocol(self):
        stream = self.get_bad_json_protocol_stream()
        api_resp_result = helpers.load_json(stream)
        self.assertEqual(len(api_resp_result['errors']), 2)
        self.assertEqual(len(api_resp_result['warnings']), 0)

    def test_load_json_with_invalid_protocol(self):
        stream = self.get_invalid_json_protocol_stream()
        api_resp_result = helpers.load_json(stream)
        self.assertEqual(len(api_resp_result['errors']), 1)
        self.assertEqual(
            api_resp_result['errors'][0], 'Cannot parse invalid JSON'
        )
