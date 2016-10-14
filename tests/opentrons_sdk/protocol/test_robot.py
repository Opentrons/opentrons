import threading
import unittest

from opentrons_sdk.robot.robot import Robot
from opentrons_sdk.containers.placeable import Deck


class RobotTest(unittest.TestCase):
    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()
        self.robot.connect()
        self.robot.home()

    def test_robot_move_to(self):
        self.robot.move_to((Deck(), (100, 0, 0)))
        self.robot.run()
        position = self.robot._driver.get_head_position()['current']
        self.assertEqual(position, (100, 0, 0))

    def test_robot_pause_and_resume(self):
        self.robot.move_to((Deck(), (100, 0, 0)))
        self.robot.move_to((Deck(), (101, 0, 0)))
        self.assertEqual(len(self.robot._commands), 2)

        self.robot.pause()

        def _run():
            self.robot.run()

        thread = threading.Thread(target=_run)
        thread.start()
        self.robot.resume()
        thread.join(0.5)

        self.assertEquals(thread.is_alive(), False)
        self.assertEqual(len(self.robot._commands), 0)

        self.robot.clear()

        self.robot.move_to((Deck(), (100, 0, 0)))
        self.robot.move_to((Deck(), (101, 0, 0)))

        def _run():
            self.robot.run()

        self.robot.pause()

        thread = threading.Thread(target=_run)
        thread.start()
        thread.join(0.01)

        self.assertEquals(thread.is_alive(), True)
        self.assertEqual(len(self.robot._commands) > 0, True)

        self.robot.resume()

    def test_mosfet(self):
        self.robot.mosfet(0, True)
        self.assertEqual(len(self.robot._commands), 1)
        self.robot.run()
        self.assertEqual(len(self.robot._commands), 0)
        self.robot.mosfet(0, True, now=True)
        self.assertEqual(len(self.robot._commands), 0)

    def test_diagnostics(self):
        res = self.robot.diagnostics()
        expected = {
            'version': {
                'config': 'v1.0.3',
                'firmware': 'v1.0.5',
                'robot': 'one_pro'
            },
            'state': {
                'axis_homed': {
                    'x': True, 'y': True, 'z': True, 'a': True, 'b': True
                },
                'switches': {
                    'x': False,
                    'y': False,
                    'z': False,
                    'a': False,
                    'b': False
                }
            }
        }
        self.assertDictEqual(res, expected)

        self.robot.connect()
        self.assertRaises(RuntimeWarning, self.robot.move_head, x=-199)
        res = self.robot.diagnostics()
        expected = {
            'version': {
                'config': 'v1.0.3',
                'firmware': 'v1.0.5',
                'robot': 'one_pro'
            },
            'state': {
                'axis_homed': {
                    'x': False, 'y': False, 'z': False, 'a': False, 'b': False
                },
                'switches': {
                    'x': True,
                    'y': False,
                    'z': False,
                    'a': False,
                    'b': False
                }
            }
        }
        self.assertDictEqual(res, expected)

        self.robot.home('x')
        res = self.robot.diagnostics()
        expected = {
            'version': {
                'config': 'v1.0.3',
                'firmware': 'v1.0.5',
                'robot': 'one_pro'
            },
            'state': {
                'axis_homed': {
                    'x': True, 'y': False, 'z': False, 'a': False, 'b': False
                },
                'switches': {
                    'x': False,
                    'y': False,
                    'z': False,
                    'a': False,
                    'b': False
                }
            }
        }
        self.assertDictEqual(res, expected)
