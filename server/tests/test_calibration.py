import unittest
import json
from unittest import mock
import os

from opentrons.robot import Robot


class CalibrationTestCase(unittest.TestCase):
    def setUp(self):
        from main import app
        self.app = app.test_client()

        self.data_path = os.path.join(
            os.path.dirname(__file__) + '/data/'
        )

        self.robot = Robot.get_instance()

    def test_move_to_container(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        self.robot.move_to = mock.Mock()

        arguments = {
            'name': 'plate-for-frontend-test',
            'slot': 'B2',
            'axis': 'b'
        }

        response = self.app.post(
            '/move_to_container',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        container = self.robot._deck['B2'].get_child_by_name(
            'plate-for-frontend-test')
        instrument = self.robot._instruments['B']
        expected = [
            mock.call(
                container[0].bottom(),
                instrument=instrument,
                strategy='arc',
                now=True)
        ]
        self.assertEquals(self.robot.move_to.mock_calls, expected)

    def test_calibrate_placeable(self):
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

    def test_calibrate_plunger(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        self.robot._instruments['B'].plunger.move(2)
        arguments = {'position': 'top', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['top']
        self.assertEquals(saved_pos, 2)

        self.robot._instruments['B'].plunger.move(3)
        arguments = {'position': 'bottom', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['bottom']
        self.assertEquals(saved_pos, 3)

        self.robot._instruments['B'].plunger.move(4)
        arguments = {'position': 'blow_out', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['blow_out']
        self.assertEquals(saved_pos, 4)

        self.robot._instruments['B'].plunger.move(5)
        arguments = {'position': 'drop_tip', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['drop_tip']
        self.assertEquals(saved_pos, 5)
