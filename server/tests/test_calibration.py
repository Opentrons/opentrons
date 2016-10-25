import unittest
import json
import os

from opentrons_sdk.robot import Robot


class CalibrationTestCase(unittest.TestCase):
    def setUp(self):
        from main import app
        self.app = app.test_client()

        self.data_path = os.path.join(
            os.path.dirname(__file__) + '/data/'
        )

        self.robot = Robot.get_instance()

    def test_calibrate(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        response = self.app.post('/calibrate_placeable', data={
            'label': 'plate',
            'axis': 'b'
        })

        print(response.data)
