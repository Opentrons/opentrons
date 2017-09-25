import serial_communication

'''
- Driver is responsible for providing a high level interface for motion control
- Driver is NOT responsible interpreting the motions in any way
'''



DEFAULT_STEPS_PER_MM = 'M92 X160.427 Y160.851 Z800 A800 B767.38 C767.38'
DEFAULT_MAX_AXIS_SPEEDS = 'M203.1 X500 Y300 Z70 A70 B40 C40'
DEFAULT_ACCELERATION = 'M204 S1000 X4000 Y3000 Z2000 A2000 B1000 C1000'
DEFAULT_CURRENT_CONTROL = 'M907 X1.0 Y1.2 Z0.9 A0.9 B0.25 C0.25'
AXES_SAFE_TO_HOME = 'XZABC' # Y cannot be homed without homing all
AXES = 'XYZABC'

GCODES = {'HOME': 'G28.2',
          'MOVE': 'G0',
          'DWELL': 'G4',
          'CURRENT_POSITION': 'M114.2',
          'TARGET_POSITION': 'M114.4',
          'LIMIT_SWITCH_STATUS': 'M119'}


class SmoothieDriver_3_0_0:

    def __init__(self):
        self.connection = serial_communication.connect()
        self._setup()


    @property
    def position(self):
        return self._send_command(GCODES['CURRENT_POSITION'])

    @property
    def target_position(self):
        return self._send_command(GCODES['TARGET_POSITION'])

    @property
    def switch_state(self):
        '''Returns the state of all SmoothieBoard limit switches'''
        return self._send_command(GCODES['SWITCH_STATUS'])


    @property
    def power(self):
        pass

    @power.setter
    def power(self, power_dict):
        pass

    @property
    def speed(self):
        pass

    @speed.setter
    def speed(self):
        pass


    # ----------- Private functions --------------- #

    def _reset(): # needed?
        pass

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=None):
        '''Sends command to serial'''
        command_line = command +' M400'
        return serial_communication.write_and_return(
            command_line, self.connection, timeout)


    def _setup(self):
        self._send_command(DEFAULT_ACCELERATION)
        self._send_command(DEFAULT_CURRENT_CONTROL)
        self._send_command(DEFAULT_MAX_AXIS_SPEEDS)
        self._send_command(DEFAULT_STEPS_PER_MM)


    def _home_all(self):
        command = GCODES['HOME'] + 'ZA ' \
                  + GCODES['HOME'] + 'XBC ' \
                  + GCODES['HOME'] + 'Y'
        self._send_command(command, timeout=30)

    # ----------- END Private functions ----------- #


    # ----------- Public interface ---------------- #
    def move(self, x=None, y=None, z=None, a=None, b=None, c=None, speed=None):
        axes_and_speed = { 'X':x, 'Y':y, 'Z':z, 'A':a, 'B':b, 'C':c, 'F':speed}
        coords = [key + str(value)
                  for key, value in axes_and_speed.items()
                  if value is not None]
        command = GCODES['MOVE'] + ''.join(coords)
        self._send_command(command)



    def home(self, axis=None):
        if not axis:
            self._home_all()
        else:
            axes_to_home = [ax for ax in axis.upper() if ax in AXES_SAFE_TO_HOME]
            if axes_to_home:
                command = GCODES['HOME'] + ''.join(axes_to_home)
                self._send_command(command)
            else:
                raise RuntimeError('Cannot home axis: {}'.format(axis))

    def delay(self, seconds):
        miliseconds = seconds * 1000
        command = GCODES['DWELL'] + 'P' + str(miliseconds)
        self._send_command(command)



    def probe(self, axis, distance):
        pass # What args?

    def kill():
        pass

    # ----------- END Public interface ------------ #