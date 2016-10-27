import unittest
import json
import os

from opentrons.robot import Robot


class ConnectDiagnosticsTestCase(unittest.TestCase):
    def setUp(self):
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
