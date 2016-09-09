import unittest
from opentrons_sdk.drivers.motor import OpenTrons, GCodeLogger


class SerialTestCase(unittest.TestCase):

    def assertLastCommand(self, *commands, index=-1):
        lastCommand = self.motor.connection.write_buffer[index].decode("utf-8") 
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

    def assertLastArguments(self, *arguments, index=-1):
        lastCommand = self.motor.connection.write_buffer[index].decode("utf-8") 
        for arg in arguments:
            msg = "Expected last command arguments to include " + \
                  "\"" + arg + "\" but got \"" + lastCommand.strip() +\
                  "\" instead."
            self.assertTrue(arg in lastCommand, msg=msg)


class OpenTronsTest(SerialTestCase):

    def setUp(self):

        # set this to True if testing with a robot connected
        # testing while connected allows the response handlers
        # and serial handshakes to be tested
        self.smoothie_connected = False

        self.motor = OpenTrons()

        if self.smoothie_connected:
            self.motor.connect('/dev/tty.usbmodem1421')
            self.motor.resume()
        else:
            self.motor.connection = GCodeLogger()

    def tearDown(self):
        self.motor.disconnect()

    def test_get_position(self):
        self.motor.home()
        coords = self.motor.get_position()
        if self.smoothie_connected:
            expected_coords = {
                'target':{'x':0,'y':0,'z':0,'a':0,'b':0},
                'current':{'x':0,'y':0,'z':0,'a':0,'b':0}
            }
            self.assertEquals(coords,expected_coords)
        else:
            self.assertLastCommand('M114')

    def test_halt(self):
        success = self.motor.halt()
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('M112')

        # must resume before any other commands can be processed
        success = self.motor.resume()
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('M999')

    def test_home(self):
        success = self.motor.home('x','y')
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G28XY',index=-2)
            self.assertLastCommand('G92')
            self.assertLastArguments('X0', 'Y0')

        success = self.motor.home('ba')
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G28AB',index=-2)
            self.assertLastCommand('G92')
            self.assertLastArguments('A0', 'B0')

    def test_move_x(self):
        success = self.motor.move(x=100)
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G0', 'G1')
            self.assertLastArguments('X100')

    def test_move_y(self):
        success = self.motor.move(y=100)
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G0', 'G1')
            self.assertLastArguments('Y100')

    def test_move_z(self):
        success = self.motor.move(z=30)
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G0', 'G1')
            self.assertLastArguments('Z30')

    def test_send_command(self):
        success = self.motor.send_command('G999 X1 Y1 Z1')
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G999')
            self.assertLastArguments('X1', 'Y1', 'Z1')

    def test_send_command_with_kwargs(self):
        success = self.motor.send_command('G999', x=1, y=2, z=3)
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G999')
            self.assertLastArguments('x1', 'y2', 'z3')

    def test_wait(self):
        success = self.motor.wait(1.234)
        if self.smoothie_connected:
            self.assertTrue(success)
        else:
            self.assertLastCommand('G4')
            self.assertLastArguments('S1', 'P234')

    def test_wait_for_arrival(self):
        if self.smoothie_connected:
            self.motor.home()
            self.motor.move(x=200,y=200)
            self.motor.move(z=30)
            success = self.motor.wait_for_arrival()
            self.assertTrue(success)
