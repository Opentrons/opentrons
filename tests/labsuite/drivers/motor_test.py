import unittest
from labsuite.drivers.motor import OpenTrons


class MockSerial():

    open = False

    def __init__(self):
        self.write_buffer = []

    def isOpen(self):
        return True

    def close(self):
        self.open = False

    def open(self):
        self.open = True

    def write(self, data):
        if self.isOpen() is False:
            raise IOError("Connection not open.")
        self.write_buffer.append(data)

    def read(self, data):
        if self.isOpen() is False:
            raise IOError("Connection not open.")
        return None


class SerialTestCase(unittest.TestCase):

    def assertLastCommand(self, *commands):
        lastCommand = self.motor.connection.write_buffer[-1]
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
        lastCommand = self.motor.connection.write_buffer[-1]
        for arg in arguments:
            msg = "Expected last command arguments to include " + \
                  "\"" + arg + "\" but got \"" + lastCommand.strip() +\
                  "\" instead."
            self.assertTrue(arg in lastCommand, msg=msg)


class OpenTronsTest(SerialTestCase):

    def setUp(self):
        self.motor = OpenTrons()
        self.motor.connection = MockSerial()

    def test_home(self):
        self.motor.home()
        self.assertLastCommand('G28')

    def test_move_x(self):
        self.motor.move(x=1)
        self.assertLastCommand('G0', 'G1')
        self.assertLastArguments('X1')

    def test_move_y(self):
        self.motor.move(y=1)
        self.assertLastCommand('G0', 'G1')
        self.assertLastArguments('Y1')

    def test_move_z(self):
        self.motor.move(z=1)
        self.assertLastCommand('G0', 'G1')
        self.assertLastArguments('Z1')

    def test_send_command(self):
        self.motor.send_command('G999 X1 Y1 Z1')
        self.assertLastCommand('G999')
        self.assertLastArguments('X1', 'Y1', 'Z1')

    def test_send_command_with_kwargs(self):
        self.motor.send_command('G999', x=1, y=2, z=3)
        self.assertLastCommand('G999')
        self.assertLastArguments('X1', 'Y2', 'Z3')

    def test_wait(self):
        self.motor.wait(1)
        self.assertLastCommand('G4')

    def test_halt(self):
        self.motor.halt()
        self.assertLastCommand('M112')

    def test_resume(self):
        self.motor.resume()
        self.assertLastCommand('M999')
