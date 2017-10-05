from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication

'''
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications 

- Driver is NOT responsible interpreting the motions in any way or knowing anything
  about what the axes are used for
'''



DEFAULT_STEPS_PER_MM = 'M92 X160.6738 Y160.5829 Z800 A800 B767.38 C767.38'
DEFAULT_MAX_AXIS_SPEEDS = 'M203.1 X500 Y300 Z50 A50 B40 C40'
DEFAULT_ACCELERATION = 'M204 S1000 X4000 Y3000 Z2000 A2000 B1000 C1000'
DEFAULT_CURRENT_CONTROL = 'M907 X1.0 Y1.2 Z0.9 A0.9 B0.25 C0.25'


AXES_SAFE_TO_HOME = 'XZABC' # Y cannot be homed without homing all
AXES = 'XYZABC'

SEC_PER_MIN = 60

GCODES = {'HOME': 'G28.2',
          'MOVE': 'G0',
          'DWELL': 'G4',
          'CURRENT_POSITION': 'M114.2',
          'TARGET_POSITION': 'M114.4',
          'LIMIT_SWITCH_STATUS': 'M119',
          'PROBE': 'G38.2',
          'ABSOLUTE_COORDS': 'G90',
          'RESET_FROM_ERROR': 'M999',
          'SET_SPEED': 'G0F'}


def _parse_axis_values(raw_axis_values):
    try:
        parsed_values = raw_axis_values.split(' ')
    except:
        raise RuntimeError("GOT THIS: ", raw_axis_values)
    parsed_values = parsed_values[2:]
    dict =  {
        s.split(':')[0].lower(): float(s.split(':')[1])
        for s in parsed_values
    }
    return dict


class SmoothieDriver_3_0_0:

    def __init__(self):

        self.simulating = True #FIXME (JG 9/28/17): Should have a more thought out way of simulating vs really running


    # FIXME (JG 9/28/17): Should have a more thought out way of simulating vs really running
    def connect(self):
        self.connection = serial_communication.connect()
        self.simulating = False

        self._setup()

    @property
    def position(self):
        parsed_position = _parse_axis_values(
            self._send_command(GCODES['CURRENT_POSITION'])
        )

        #FIXME (JG | 10/1/17) recovery attempt hack
        if 'x' not in parsed_position:
            parsed_position = _parse_axis_values(
                self._send_command(GCODES['CURRENT_POSITION'])
            )

        return parsed_position

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

    def set_power(self, power_dict):
        pass

    @property
    def speed(self):
        pass

    def set_speed(self, value):
        ''' set total movement speed in mm/second'''
        speed = value * SEC_PER_MIN
        command = GCODES['SET_SPEED'] + str(speed)
        self._send_command(command)


    # ----------- Private functions --------------- #

    def _reset_from_error(self):
        self._send_command(GCODES['RESET_FROM_ERROR'])

    #TODO: Write GPIO low
    def _reboot(self):
        pass

        self._setup()

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=None):
        if self.simulating == True:
            print('Simulating command: ', command)
            return "Virtual!"
            # return virtual_driver.write_and_return(command)
        '''Sends command to serial'''
        command_line = command +' M400'
        return serial_communication.write_and_return(
            command_line, self.connection, timeout)


    def _setup(self):
        self._reset_from_error()
        self._send_command(DEFAULT_ACCELERATION)
        self._send_command(DEFAULT_CURRENT_CONTROL)
        self._send_command(DEFAULT_MAX_AXIS_SPEEDS)
        self._send_command(DEFAULT_STEPS_PER_MM)
        self._send_command(GCODES['ABSOLUTE_COORDS'])


    def _home_all(self):
        command = GCODES['HOME'] + 'ZA ' \
                  + GCODES['HOME'] + 'XBC ' \
                  + GCODES['HOME'] + 'Y'
        self._send_command(command, timeout=30)

    # ----------- END Private functions ----------- #


    # ----------- Public interface ---------------- #

    def move(self, x=None, y=None, z=None, a=None, b=None, c=None):
        target_position = { 'X':x, 'Y':y, 'Z':z, 'A':a, 'B':b, 'C':c}
        coords = [axis + str(coords)
                  for axis, coords in target_position.items()
                  if coords is not None]
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
        seconds = int(seconds)
        milliseconds = (seconds % 1.0) * 1000
        command = GCODES['DWELL'] + 'S' + str(seconds) + 'P' + str(milliseconds)
        self._send_command(command)

    def probe_axis(self, axis, probing_distance):
        if axis.upper() in AXES:
            command = GCODES['PROBE'] + axis.upper() + str(probing_distance)
            self._send_command(command=command, timeout=30)
            position_return = self.position[axis]
            return position_return
        else:
            raise RuntimeError("Cant probe axes {}".format(axis))

    #TODO: Write GPIO low
    def kill(self):
        pass



    # ----------- END Public interface ------------ #