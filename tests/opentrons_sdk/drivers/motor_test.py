import unittest
from opentrons_sdk.drivers.motor import OpenTrons, GCodeLogger


class SerialTestCase(unittest.TestCase):

    def assertLastCommand(self, *commands):
        lastCommand = self.motor.connection.write_buffer[-1].decode("utf-8") 
        foundOne = False
        for command in commands:
            if lastCommand.startswith(command):
                foundOne = True
                break

        msg = "Expected last CNC command to be "

        if len(commands) is 1:
            msg += '"' + commands[0] + '" '
        else:
            msg += "one of: " + ", ".join(commands) + " "

        msg += "but got \"" + lastCommand.strip() + "\"."

        self.assertTrue(foundOne, msg=msg)

    def assertLastArguments(self, *arguments):
        lastCommand = self.motor.connection.write_buffer[-1].decode("utf-8") 
        for arg in arguments:
            msg = "Expected last command arguments to include " + \
                  "\"" + arg + "\" but got \"" + lastCommand.strip() +\
                  "\" instead."
            self.assertTrue(arg in lastCommand, msg=msg)


class OpenTronsTest(SerialTestCase):

    def setUp(self):

        self.connected = True

        self.motor = OpenTrons()

        if self.connected:
            self.motor.connect('/dev/tty.usbmodem1421')
        else:
            self.motor.connection = GCodeLogger()

    def tearDown(self):
        self.motor.disconnect()

    def test_home(self):
        res = self.motor.home()
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('G28')

    def test_move_x(self):
        res = self.motor.move(x=100)
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('G0', 'G1')
            self.assertLastArguments('X100')

    def test_move_y(self):
        res = self.motor.move(y=100)
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('G0', 'G1')
            self.assertLastArguments('Y100')

    def test_move_z(self):
        res = self.motor.move(z=30)
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('G0', 'G1')
            self.assertLastArguments('Z30')

    def test_send_command(self):
        res = self.motor.send_command('G999 X1 Y1 Z1')
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('G999')
            self.assertLastArguments('X1', 'Y1', 'Z1')

    def test_send_command_with_kwargs(self):
        res = self.motor.send_command('G999', x=1, y=2, z=3)
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('G999')
            self.assertLastArguments('X1', 'Y2', 'Z3')

    def test_wait(self):
        res = self.motor.wait(1)
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('G4')

    def test_halt(self):
        res = self.motor.halt()
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('M112')

        # must resume before any other commands can be processed
        self.motor.resume()

    def test_resume(self):
        res = self.motor.resume()
        if self.connected:
            self.assertTrue(res.startswith(b'ok'))
        else:
            self.assertLastCommand('M999')
