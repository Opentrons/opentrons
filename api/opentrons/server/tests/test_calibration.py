import unittest
import json
from unittest import mock
import os

from opentrons.robot import Robot


class CalibrationTestCase(unittest.TestCase):
    def setUp(self):
        Robot.get_instance().reset_for_tests()
        from main import app
        self.app = app.test_client()

        self.data_path = os.path.join(
            os.path.dirname(__file__) + '/data/'
        )
        self.robot = Robot.get_instance()
        self.robot.connect()

    def test_move_to_slot(self):
        arguments = {
            'slot': 'A1'
        }
        response = self.app.post(
            '/move_to_slot',
            data=json.dumps(dict(arguments)),
            content_type='application/json')
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        arguments = {
            'slot': 'A4'
        }
        response = self.app.post(
            '/move_to_slot',
            data=json.dumps(dict(arguments)),
            content_type='application/json')
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'error')

    def test_aspirate_dispense(self):

        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        self.assertEquals(self.robot._instruments['B'].max_volume, 10)

        self.robot._instruments['B'].calibrate_plunger(
            top=0, bottom=5, blow_out=6, drop_tip=7)

        # moving the head down (as the user would have already done)
        # so limit switch isn't hit during this test
        self.robot.move_head(z=0)

        arguments = {
            'axis': 'b'
        }
        response = self.app.post(
            '/aspirate',
            data=json.dumps(dict(arguments)),
            content_type='application/json')
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        arguments = {
            'axis': 'b'
        }
        response = self.app.post(
            '/dispense',
            data=json.dumps(dict(arguments)),
            content_type='application/json')
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        arguments = {
            'axis': 'b',
            'volume': 12
        }
        response = self.app.post(
            '/set_max_volume',
            data=json.dumps(dict(arguments)),
            content_type='application/json')
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        self.assertEquals(self.robot._instruments['B'].max_volume, 12)

    def test_move_to_plunger_position(self):

        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        self.robot._instruments['B'].motor.move(12)
        self.robot._instruments['B'].calibrate('bottom')
        self.robot._instruments['B'].motor.move(2)
        current_pos = self.robot._driver.get_plunger_positions()['target']
        self.assertEquals(current_pos['b'], 2)

        arguments = {
            'position': 'bottom',
            'axis': 'b'
        }
        response = self.app.post(
            '/move_to_plunger_position',
            data=json.dumps(dict(arguments)),
            content_type='application/json')
        self.assertEqual(status, 'success')
        current_pos = self.robot._driver.get_plunger_positions()['target']
        self.assertEquals(current_pos['b'], 12)

    def test_move_to_container(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        self.robot.move_head = mock.Mock()

        arguments = {
            'label': 'test-plate',
            'slot': 'B2',
            'axis': 'b'
        }

        response = self.app.post(
            '/move_to_container',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        expected = [
            mock.call(z=100),
            mock.call(x=112.24, y=158.83999999999997),
            mock.call(z=0.0)
        ]
        self.assertEquals(self.robot.move_head.mock_calls, expected)

    def test_calibrate_placeable(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        arguments = {
            'label': 'test-plate',
            'axis': 'b',
            'slot': 'B2'
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

        self.assertEqual(name, 'test-plate')
        self.assertEqual(axis, 'b')
        self.assertTrue(bool(step_list))
        self.assertEqual(status, 'success')

    def test_calibrate_plunger(self):
        response = self.app.post('/upload', data={
            'file': (open(self.data_path + 'protocol.py', 'rb'), 'protocol.py')
        })
        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')

        self.robot._instruments['B'].motor.move(2)
        arguments = {'position': 'top', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['top']
        self.assertEquals(saved_pos, 2)

        self.robot._instruments['B'].motor.move(3)
        arguments = {'position': 'bottom', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['bottom']
        self.assertEquals(saved_pos, 3)

        self.robot._instruments['B'].motor.move(4)
        arguments = {'position': 'blow_out', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['blow_out']
        self.assertEquals(saved_pos, 4)

        self.robot._instruments['B'].motor.move(5)
        arguments = {'position': 'drop_tip', 'axis': 'b'}
        response = self.app.post(
            '/calibrate_plunger',
            data=json.dumps(dict(arguments)),
            content_type='application/json')

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
        saved_pos = self.robot._instruments['B'].positions['drop_tip']
        self.assertEquals(saved_pos, 5)
