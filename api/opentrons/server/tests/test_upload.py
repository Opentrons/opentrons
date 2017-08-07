import unittest
import json
import os

from opentrons.robot import Robot


class UploadTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
        from main import app
        self.app = app.test_client()

        self.data_path = os.path.join(
            os.path.dirname(__file__) + '/data/'
        )
        self.robot = app.robot
        self.robot.reset()

    def tearDown(self):
        del self.robot
        del self.app

    def test_upload_and_run(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        self.robot.connect(None, options={'limit_switches': False})

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        response = self.app.get('/run')

        response = json.loads(response.data.decode())
        self.assertEqual(response['status'], 'success')

    def test_get_instrument_placeables(self):
        self.robot.connect(options={'limit_switches': False})
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })
        response = json.loads(response.data.decode())
        self.assertEquals(response['status'], 'success')

        self.robot._instruments['A'].positions = {
            'top': 0,
            'bottom': 1,
            'blow_out': 2,
            'drop_tip': None
        }
        self.robot._instruments['B'].positions = {
            'top': None,
            'bottom': None,
            'blow_out': None,
            'drop_tip': None
        }

        for instrument in self.robot._instruments.values():
            instrument.calibration_data = {}
            instrument.update_calibrations()

        location = self.robot._deck['A1'].get_child_by_name(
            'test-tiprack')
        rel_vector = location[0].from_center(
            x=0, y=0, z=-1, reference=location)
        location = (location, rel_vector)

        pipette = self.robot._instruments['A']
        pipette.calibrate_position(location)

        response = self.app.get('/instruments/placeables')
        response = json.loads(response.data.decode())
        self.assertEquals(response['status'], 'success')

        expected_data = {
            'data': [
                {
                    'axis': 'a',
                    'blow_out': 2,
                    'bottom': 1,
                    'drop_tip': None,
                    'label': 'p10',
                    'max_volume': 10,
                    'placeables': [
                        {
                            'calibrated': True,
                            'label': 'test-tiprack',
                            'slot': 'A1',
                            'type': 'tiprack-200ul'
                        },
                        {
                            'calibrated': False,
                            'label': 'test-trough',
                            'slot': 'B1',
                            'type': 'trough-12row'
                        },
                        {
                            'calibrated': False,
                            'label': 'test-plate',
                            'slot': 'B2',
                            'type': '96-flat'
                        },
                        {
                            'calibrated': False,
                            'label': 'test-trash',
                            'slot': 'A2',
                            'type': 'point'
                        }
                    ],
                    'top': 0
                },
                {
                    'axis': 'b',
                    'blow_out': None,
                    'bottom': None,
                    'drop_tip': None,
                    'label': 'p200',
                    'max_volume': 200,
                    'placeables': [
                        {
                            'calibrated': False,
                            'label': 'test-tiprack',
                            'slot': 'A1',
                            'type': 'tiprack-200ul'
                        },
                        {
                            'calibrated': False,
                            'label': 'test-trough',
                            'slot': 'B1',
                            'type': 'trough-12row'
                        },
                        {
                            'calibrated': False,
                            'label': 'test-plate',
                            'slot': 'B2',
                            'type': '96-flat'
                        },
                        {
                            'calibrated': False,
                            'label': 'test-trash',
                            'slot': 'A2',
                            'type': 'point'
                        }
                    ],
                    'top': None
                }
            ],
            'status': 200
        }

        response_data = response['data'][0]
        for key, value in expected_data['data'][0].items():
            if key != 'placeables':
                self.assertEquals(value, response_data[key])
                pass
            else:
                for placeable in value:
                    self.assertTrue(placeable in response_data['placeables'])
                    pass
