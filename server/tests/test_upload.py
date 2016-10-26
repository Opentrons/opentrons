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

        robot = Robot.get_instance()
        location = robot._deck['A1'].get_child_by_name('tiprack')
        rel_vector = location[0].from_center(
            x=0, y=0, z=-1, reference=location)
        location = (location, rel_vector)

        pipette = robot._instruments['A']
        pipette.calibrate_position(location)

        response = self.app.get('/instruments/placeables')
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
                            'calibrated': True,
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

        response_data = response['data'][0]
        for key, value in expected_data['data'][0].items():
            if key != 'placeables':
                self.assertEquals(value, response_data[key])
            else:
                for placeable in value:
                    self.assertTrue(placeable in response_data['placeables'])

    def test_upload_invalid_python(self):
        pass

    def test_upload_valid_json(self):
        response = self.app.post('/upload', data={
            'file': (
                open(self.data_path + 'good_json_protocol.json', 'rb'),
                'good_json_protocol.json'
            )
        })
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

    def test_upload_invalid_json(self):
        response = self.app.post('/upload', data={
            'file': (
                open(self.data_path + 'invalid_json_protocol.json', 'rb'),
                'good_json_protocol.json'
            )
        })
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
