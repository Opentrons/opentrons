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

        arguments = {
            'label': 'plate-for-frontend-test',
            'axis': 'b'
        }

        response = self.app.post(
            '/calibrate_placeable',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        actual = json.loads(response.data.decode())
        name = actual['data']['name']
        axis = actual['data']['axis']
        step_list = actual['data']['calibrations']
        status = actual['status']

        self.assertEqual(name, 'plate-for-frontend-test')
        self.assertEqual(axis, 'b')
        self.assertTrue(bool(step_list))
        self.assertEqual(status, 'success')
