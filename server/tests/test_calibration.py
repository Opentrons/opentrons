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
            'label': 'plate',
            'axis': 'b'
        }

        response = self.app.post(
            '/calibrate_placeable',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        actual = json.loads(response.data.decode())
        expected = {
            'data': {
                'name': 'plate',
                'axis': 'b',
                'calibration_data': {
                    'B2': {
                        'children': {
                            'plate': {
                                'delta': {
                                    'x': -160.0,
                                    'z': 120.0,
                                    'y': 124.05
                                }
                            }
                        }
                    }
                }
            },
            'status': 'success'
        }
        self.assertDictEqual(actual, expected)
