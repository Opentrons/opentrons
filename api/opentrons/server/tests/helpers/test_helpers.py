import io
import os
import unittest
from unittest import mock

from opentrons.robot import Robot

from opentrons.server import helpers


class MiscHelpersTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot.get_instance()
        self.robot.connect()

    def test_convert_bytes_stream_to_str(self):
        text = ['line 1', 'line 2', 'foo bar']
        bytes_stream = io.BytesIO()
        [bytes_stream.write(i.encode()) for i in text]
        bytes_stream.seek(0)
        text_res = helpers.convert_byte_stream_to_str(bytes_stream)
        self.assertEqual(''.join(text), text_res)

    def test_get_upload_proof_robot(self):
        methods = [
            'connect',
            'disconnect',
            'move_head',
            'move_plunger',
            'reset',
            'run',
            'simulate'
        ]

        real_list = [getattr(self.robot, i) for i in methods]
        [setattr(self.robot, i, mock.Mock()) for i in methods]
        mock_list = [getattr(self.robot, i) for i in methods]

        patched_robot, restore = helpers.get_upload_proof_robot(self.robot)

        # Call all methods after patching
        [getattr(patched_robot, i)(patched_robot) for i in methods]

        # Assert none of the real methods were called after patching
        [self.assertFalse(i.called) for i in mock_list]

        robot = restore()
        [getattr(robot, i)(patched_robot) for i in methods]

        [self.assertTrue(i.called) for i in mock_list]

        # Restore real methods
        [setattr(self.robot, i, real_list.pop(0)) for i in methods]


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
