import serial
import time
from labsuite.util import log


class GCodeLogger():

    """
    GCodeLogger pretends to be a serial connection and logs all the stuff it
    would send to the serial port instead of actually sending it to a
    serial port.
    """

    open = False

    write_buffer = None

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
        log.debug('GCodeLogger', 'Writing: {}'.format(data))
        self.write_buffer.append(data)

    def read(self, data):
        if self.isOpen() is False:
            raise IOError("Connection not open.")
        return None

    def readline(self):
        return 'ok'


class CNCDriver(object):

    """
    This object outputs raw GCode commands to perform high-level tasks.
    """

    RAPID_MOVE = 'G0'
    MOVE = 'G1'
    DWELL = 'G4'
    HOME = 'G28'
    SET_POSITION = 'G92'
    MOTORS_ON = 'M17'
    MOTORS_OFF = 'M18'
    HALT = 'M112'
    CALM_DOWN = 'M999'

    ABSOLUTE_POSITIONING = 'G90'
    RELATIVE_POSITIONING = 'G91'

    UNITS_TO_INCHES = 'G20'
    UNITS_TO_MILLIMETERS = 'G22'

    DEBUG_ON = None
    DEBUG_OFF = None

    """
    If simulated is set to true, all GCode commands will be saved to an
    internal list instead of being sent to the actual device.
    """
    simulated = False
    command_queue = None  # []

    """
    Serial port connection to talk to the device.
    """
    connection = None

    _wait_for_stat = False
    _stat_command = None

    def __init__(self, inches=False, simulate=False):
        self.simulated = simulate
        self.command_queue = []

    def connect(self, device=None, port=None):
        self.connection = serial.Serial(port=device or port)
        self.connection.close()
        self.connection.open()
        log.debug("Serial", "Connected to {}".format(device or port))
        self.wait_for_stat()

    def wait_for_stat(self, stat=None):
        if self.DEBUG_ON:
            log.debug("Serial", "Turning on debug mode.")
            log.debug("Serial", "Awaiting stat responses.")
            self.send_command(self.DEBUG_ON)
            self._wait_for_stat = True
            if stat is not None:
                self._stat_command = stat

    def disconnect(self):
        self.connection.close()

    def send_command(self, command, **kwargs):
        """
        Sends a GCode command.  Keyword arguments will be automatically
        converted to GCode syntax.

        Returns a string represending the raw command sent.

        >>> send_command(self.MOVE, x=100 y=100)
        G0 X100 Y100
        """

        args = []
        for key in kwargs:
            args.append("%s%d" % (key.upper(), kwargs[key]))

        command = command + " " + ' '.join(args) + "\r\n"

        if self.simulated:
            self.command_queue.append(command)
        else:
            self.write_to_serial(command)

        return command

    def write_to_serial(self, data, max_tries=10, try_interval=0.2):
        log.debug("Serial", "Write: {}".format(str(data).encode()))
        if self.connection is None:
            log.warn("Serial", "No connection found.")
            return
        if self.connection.isOpen():
            self.connection.write(str(data).encode())
            if self._wait_for_stat is True and self._stat_command:
                waiting = True
                count = 0
                while waiting:
                    count = count + 1
                    out = self.connection.readline().decode().strip()
                    log.debug("Serial", "Read: {}".format(out))
                    if out == self._stat_command:
                        waiting = False
                        log.debug(
                            "Serial",
                            "Waited {} lines for stat.".format(count)
                        )
                    else:
                        if count == 1 or count % 10 == 0:
                            # Don't log all the time; gets spammy.
                            log.debug(
                                "Serial",
                                "Waiting {} lines for stat ({})."
                                .format(count, self._stat_command)
                            )
            else:
                out = self.connection.readline()
                log.debug("Serial", "Read: {}".format(out))
            return out
        elif max_tries > 0:
            time.sleep(try_interval)
            self.write_to_serial(
                data, max_tries=max_tries - 1, try_interval=try_interval
            )
        else:
            log.error("Serial", "Cannot connect to serial port.")

    def read_from_serial(self, size=16):
        return self.connection.read(size)

    def move(self, x=None, y=None, z=None, speed=None, absolute=True, **kwargs):

        if speed:
            code = self.MOVE
        else:
            code = self.RAPID_MOVE

        if absolute:
            self.send_command(self.ABSOLUTE_POSITIONING)
        else:
            self.send_command(self.RELATIVE_POSITIONING)

        args = {}

        """
        Add x, y and z back to the kwargs.  They're omitted when we name them
        as explicit keyword arguments, but it's much nicer to be able to pass
        them as anonymous parameters when calling this method.
        """
        if x is not None:
            args['x'] = x
        if y is not None:
            args['y'] = y
        if z is not None:
            args['z'] = z

        for k in kwargs:
            args[k.upper()] = kwargs[k]

        log.debug("MotorDriver", "Moving: {}".format(args))

        self.send_command(code, **args)

    def home(self):
        self.send_command(self.HOME)

    def wait(self, ms):
        self.send_command(self.DWELL, p=ms)

    def halt(self):
        self.send_command(self.HALT)

    def resume(self):
        self.send_command(self.CALM_DOWN)

    def set_position(self, **kwargs):
        self.move(absolute=True, **kwargs)

    def execute_queue(self):
        queue = self.flush_queue()
        map(self.send, queue)

    def flush_queue(self):
        q = self.command_queue
        self.command_queue = []
        return q

    def run_tap(self, filename):
        self.home()
        self.send_command(self.UNITS_TO_MILLIMETERS)
        self.send_command(self.ABSOLUTE_POSITIONING)
        lines = open(filename).readlines()
        for l in lines:
            self.send_command(l)


class OpenTrons(CNCDriver):

    DEBUG_ON = 'M62'
    DEBUG_OFF = 'M63'

    _stat_command = '{"stat":0}'


class MoveLogger(CNCDriver):

    """
    This is one level higher than the G-code; it logs moves whereas the
    G-code logger logs low-level serial data being written to the physical
    motor controller.

    We can use this to get a low-level movement command to send off to some
    other theoretical motor control driver stack, or we can use it for
    testing.
    """

    movements = []

    def __init__(self):
        self.movements = []
        self.motor = OpenTrons()
        self.motor._wait_for_stat = False
        self.motor.connection = GCodeLogger()

    def move(self, **kwargs):
        kwargs = dict((k.lower(), v) for k, v in kwargs.items())
        self.movements.append(kwargs)
        self.motor.move(**kwargs)

    def isOpen(self):
        return True

    def write(self, data):
        pass
