import unittest
import json
import os

from opentrons.robot import Robot


class ConnectDiagnosticsTestCase(unittest.TestCase):
    def setUp(self):
        Robot.get_instance().reset_for_tests()
        from main import app
        self.app = app.test_client()

        self.data_path = os.path.join(
            os.path.dirname(__file__) + '/data/'
        )
        self.robot = Robot.get_instance()
        self.robot.connect()

    def upload_protocol(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

    def test_connect(self):
        data = {
            'port': None,
            'options': {
                'firmware': 'v1.0.6'
            }
        }
        response = self.app.post(
            '/robot/serial/connect',
            data=json.dumps(dict(data)),
            content_type='application/json')

        response = json.loads(response.data.decode())
        self.assertEqual(response['status'], 'error')

        response = self.app.get(
            '/robot/serial/is_connected',
            content_type='application/json')
        response = json.loads(response.data.decode())
        self.assertFalse(response['is_connected'])

        response = self.app.post(
            '/robot/serial/connect',
            data=json.dumps(dict({})),
            content_type='application/json')
        response = json.loads(response.data.decode())
        self.assertEqual(response['status'], 'success')

        response = self.app.get(
            '/robot/serial/is_connected',
            content_type='application/json')
        response = json.loads(response.data.decode())
        self.assertTrue(response['is_connected'])
        self.assertEquals(response['port'], 'Virtual Smoothie')

    def test_diagnostics(self):
        self.robot.disconnect()
        self.robot.connect()

        response = self.app.get(
            '/robot/diagnostics',
            content_type='application/json')
        response = json.loads(response.data.decode())
        expected = {
            'axis_homed': {
                'x': False, 'y': False, 'z': False, 'a': False, 'b': False
            },
            'switches': {
                'x': False, 'y': False, 'z': False, 'a': False, 'b': False
            },
            'steps_per_mm': {
                'x': 80.0, 'y': 80.0
            }
        }
        self.assertEqual(response['diagnostics'], expected)

    def test_versions(self):
        self.robot.disconnect()
        self.robot.connect()

        response = self.app.get(
            '/robot/versions',
            content_type='application/json')
        response = json.loads(response.data.decode())
        expected = {
            'firmware': {
                'version': 'v1.0.5',
                'compatible': True
            },
            'config': {
                'version': 'v1.0.3b',
                'compatible': True
            },
            'ot_version': {
                'version': 'one_pro',
                'compatible': True
            }
        }
        self.assertListEqual(
            sorted(list(response['versions'].keys())),
            sorted(list(expected.keys()))
        )
