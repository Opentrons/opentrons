import io
import unittest

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
