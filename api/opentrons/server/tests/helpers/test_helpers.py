import io
import os
import unittest
from unittest import mock

from opentrons.robot import Robot

from opentrons.server import helpers


class MiscHelpersTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
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
