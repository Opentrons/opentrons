import unittest
import json
import os

from opentrons_sdk.robot import Robot


class UploadTestCase(unittest.TestCase):
    def setUp(self):
        from main import app
        self.app = app.test_client()

        self.data_path = os.path.join(
            os.path.dirname(__file__) + '/data/'
        )

        self.robot = Robot.get_instance()

    def test_upload_valid_python(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

    def test_get_instrument_placeables(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })
        response = json.loads(response.data.decode())
        self.assertEquals(response['status'], 'success')

        expected_data = {
            'data': [
                {
                    'axis': 'a',
                    'blow_out': 13,
                    'bottom': 11,
                    'drop_tip': 14,
                    'label': 'p10',
                    'max_volume': 10,
                    'placeables': [
                        {
                            'calibrated': False,
                            'label': 'tiprack',
                            'slot': 'A1',
                            'type': 'tiprack-200ul'
                        },
                        {
                            'calibrated': False,
                            'label': 'trough',
                            'slot': 'B1',
                            'type': 'trough-12row'
                        },
                        {
                            'calibrated': False,
                            'label': 'plate',
                            'slot': 'B2',
                            'type': '96-flat'
                        },
                        {
                            'calibrated': False,
                            'label': 'trash',
                            'slot': 'A2',
                            'type': 'point'
                        }
                    ],
                    'top': 0
                },
                {
                    'axis': 'b',
                    'blow_out': 12,
                    'bottom': 10,
                    'drop_tip': 13,
                    'label': 'p200',
                    'max_volume': 200,
                    'placeables': [
                        {
                            'calibrated': False,
                            'label': 'tiprack',
                            'slot': 'A1',
                            'type': 'tiprack-200ul'
                        },
                        {
                            'calibrated': False,
                            'label': 'trough',
                            'slot': 'B1',
                            'type': 'trough-12row'
                        },
                        {
                            'calibrated': False,
                            'label': 'plate',
                            'slot': 'B2',
                            'type': '96-flat'
                        },
                        {
                            'calibrated': False,
                            'label': 'trash',
                            'slot': 'A2',
                            'type': 'point'
                        }
                    ],
                    'top': 0
                }
            ],
            'status': 200
        }

        response_data = response['data']['calibrations'][0]
        for key, value in expected_data['data'][0].items():
            if key != 'placeables':
                self.assertEquals(value, response_data[key])
            else:
                for placeable in value:
                    self.assertTrue(placeable in response_data['placeables'])

    def test_upload_invalid_python(self):
        pass

    def test_upload_valid_json(self):
        pass

    def test_upload_invalid_json(self):
        pass
