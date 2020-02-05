import asyncio
import logging
import os
import threading
import serial  # type: ignore
from queue import Queue
try:
    import select
except ModuleNotFoundError:
    select = None  # type: ignore
from time import sleep
from typing import Optional, Mapping
from serial.serialutil import SerialException  # type: ignore
from opentrons.drivers import serial_communication, utils
from opentrons.drivers.serial_communication import SerialNoResponse


log = logging.getLogger(__name__)

GCODES = {
    'OPEN_LID': 'M126',
    'CLOSE_LID': 'M127',
    'GET_LID_STATUS': 'M119',
    'SET_LID_TEMP': 'M140',
    'GET_LID_TEMP': 'M141',
    'EDIT_PID_PARAMS': 'M301',
    'SET_PLATE_TEMP': 'M104',
    'GET_PLATE_TEMP': 'M105',
    'SET_RAMP_RATE': 'M566',
    'DEACTIVATE_ALL': 'M18',
    'DEACTIVATE_LID': 'M108',
    'DEACTIVATE_BLOCK': 'M14',
    'DEVICE_INFO': 'M115'
}
LID_TARGET_DEFAULT = 105    # Degree celsius
LID_TARGET_MIN = 37
LID_TARGET_MAX = 110
BLOCK_TARGET_MIN = 0
BLOCK_TARGET_MAX = 99
TEMP_UPDATE_RETRIES = 15


def _build_temp_code(temp: float,
                     hold_time: Optional[float],
                     volume: Optional[float]):
    if temp < BLOCK_TARGET_MIN:
        temp = BLOCK_TARGET_MIN
    if temp > BLOCK_TARGET_MAX:
        temp = BLOCK_TARGET_MAX
    cmd = f"{GCODES['SET_PLATE_TEMP']} S{temp}"
    if hold_time:
        cmd += f' H{hold_time}'
    if volume:
        cmd += f' V{volume}'
    return cmd, temp


TC_BAUDRATE = 115200
TC_BOOTLOADER_BAUDRATE = 1200
# TODO (Laura 20190327) increased the thermocycler command timeout
# temporarily until we can change the firmware to asynchronously handle
# the lid being open and closed
SERIAL_ACK = '\r\n'
TC_COMMAND_TERMINATOR = SERIAL_ACK
TC_ACK = 'ok' + SERIAL_ACK + 'ok' + SERIAL_ACK
ERROR_KEYWORD = 'error'
DEFAULT_TC_TIMEOUT = 40
DEFAULT_COMMAND_RETRIES = 3
DEFAULT_STABILIZE_DELAY = 0.1
POLLING_FREQUENCY_MS = 1000
TEMP_THRESHOLD = 0.5


class ThermocyclerError(Exception):
    pass


class TCPoller(threading.Thread):
    def __init__(self, port, interrupt_callback, temp_status_callback,
                 lid_status_callback, lid_temp_status_callback):
        if not select:
            raise RuntimeError("Cannot connect to a Thermocycler from Windows")
        self._port = port
        self._connection = self._connect_to_port()
        self._interrupt_callback = interrupt_callback
        self._temp_status_callback = temp_status_callback
        self._lid_status_callback = lid_status_callback
        self._lid_temp_status_callback = lid_temp_status_callback
        self._lock = threading.Lock()
        self._command_queue = Queue()

        # Note: the options and order of operations for opening file
        # descriptors is very specific. For more info, see:
        # http://pubs.opengroup.org/onlinepubs/007908799/xsh/open.html
        self._send_path = '/var/run/tc_send_fifo_{}'.format(hash(self))
        os.mkfifo(self._send_path)
        send_read_fd = os.open(
            self._send_path, flags=os.O_RDONLY | os.O_NONBLOCK)
        self._send_read_file = os.fdopen(send_read_fd, 'rb')
        self._send_write_fd = open(self._send_path, 'wb', buffering=0)

        self._halt_path = '/var/run/tc_halt_fifo_{}'.format(hash(self))
        os.mkfifo(self._halt_path)
        halt_read_fd = os.open(
            self._halt_path, flags=os.O_RDONLY | os.O_NONBLOCK)
        self._halt_read_file = os.fdopen(halt_read_fd, 'rb')
        self._halt_write_fd = open(self._halt_path, 'wb', buffering=0)

        self._poller = select.poll()
        self._poller.register(self._send_read_file, select.POLLIN)
        self._poller.register(self._halt_read_file, select.POLLIN)
        self._poller.register(self._connection, select.POLLIN)

        serial_thread_name = 'tc_serial_poller_{}'.format(hash(self))
        super().__init__(target=self._serial_poller, name=serial_thread_name)
        log.info("Starting TC thread {}".format(serial_thread_name))
        super().start()

    @property
    def port(self):
        return self._port

    def _serial_poller(self):
        """ Priority-sorted list of checks

        Highest priority is the 'halt' channel, which is used to kill the
        thread and the serial communication channel and allow everything to be
        cleaned up.

        Second is the lid-open interrupt, which should trigger a callback
        (typically to halt the robot).

        Third is an enqueued command to send to the Thermocycler.

        Fourth (if no other work is available) is to query the Thermocycler for
        its current temp, target temp, and time remaining in its current cycle.
        """
        while True:
            _next = dict(self._poller.poll(POLLING_FREQUENCY_MS))
            if self._halt_read_file.fileno() in _next:
                log.debug("Poller [{}]: halt".format(hash(self)))
                self._halt_read_file.read()
                # Note: this is discarded because we send a set message to halt
                # the thread--don't currently need to parse it
                break

            elif self._connection.fileno() in _next:
                # Lid-open interrupt
                log.debug("Poller [{}]: interrupt".format(hash(self)))
                res = self._connection.read_until(SERIAL_ACK)
                self._interrupt_callback(res)

            elif self._send_read_file.fileno() in _next:
                self._send_read_file.read(1)
                command, callback = self._command_queue.get()
                log.debug("Poller [{}]: send {}".format(hash(self), command))
                res = self._send_command(command)
                callback(res)
            else:
                # Nothing else to do--update device status
                log.debug("Poller [{}]: updating temp".format(hash(self)))
                res = self._send_command(GCODES['GET_PLATE_TEMP'])
                self._temp_status_callback(res)
                res = self._send_command(GCODES['GET_LID_STATUS'])
                self._lid_status_callback(res)
                res = self._send_command(GCODES['GET_LID_TEMP'])
                self._lid_temp_status_callback(res)
        log.info("Exiting TC poller loop [{}]".format(hash(self)))

    def _wait_for_ack(self):
        """
        This method writes a sequence of newline characters, which will
        guarantee the device responds with 'ok\r\nok\r\n' within 1 second
        """
        self._send_command(SERIAL_ACK, timeout=DEFAULT_TC_TIMEOUT)

    def _send_command(self, command, timeout=DEFAULT_TC_TIMEOUT):
        command_line = command + ' ' + TC_COMMAND_TERMINATOR
        ret_code = self._recursive_write_and_return(
            command_line, timeout, DEFAULT_COMMAND_RETRIES)
        if ERROR_KEYWORD in ret_code.lower():
            log.error('Received error message from Thermocycler: {}'.format(
                ret_code))
            raise ThermocyclerError(ret_code)
        return ret_code.strip()

    def _recursive_write_and_return(self, cmd, timeout, retries):
        try:
            return serial_communication.write_and_return(
                cmd, TC_ACK, self._connection, timeout,
                tag=f'thermocycler {id(self)}')
        except SerialNoResponse as e:
            retries -= 1
            if retries <= 0:
                raise e
            sleep(DEFAULT_STABILIZE_DELAY)
            if self._connection:
                self._connection.close()
                self._connection.open()
            return self._recursive_write_and_return(
                cmd, timeout, retries)

    def _connect_to_port(self):
        try:
            return serial_communication.connect(port=self._port,
                                                baudrate=TC_BAUDRATE)
        except SerialException:
            raise SerialException(
                "Thermocycler device not found on {}".format(self._port))

    def send(self, command, callback):
        with self._lock:
            self._command_queue.put((command, callback))
            self._send_write_fd.write(b'c')

    def close(self):
        self._halt_write_fd.write(b'q')

    def __del__(self):
        """ Clean up thread fifos"""
        try:
            os.unlink(self._send_path)
        except NameError:
            pass
        try:
            os.unlink(self._halt_path)
        except NameError:
            pass


class Thermocycler:
    def __init__(self, interrupt_callback):
        self._poller = None
        self._update_thread = None
        self._current_temp = None
        self._target_temp = None
        self._ramp_rate = None
        self._hold_time = None
        self._lid_status = None
        self._interrupt_cb = interrupt_callback
        self._lid_target = None
        self._lid_temp = None

    async def connect(self, port: str) -> 'Thermocycler':
        self.disconnect()
        self._poller = TCPoller(
            port, self._interrupt_callback,
            self._temp_status_update_callback,
            self._lid_status_update_callback,
            self._lid_temp_status_callback)

        # Check initial device lid state
        _lid_status_res = await self._write_and_wait(GCODES['GET_LID_STATUS'])
        if _lid_status_res:
            self._lid_status = utils.parse_string_value_from_substring(
                _lid_status_res.split()[-1])
        return self

    def disconnect(self) -> 'Thermocycler':
        if self.is_connected():
            self._poller.close()
            self._poller.join()
        self._poller = None
        return self

    async def deactivate_all(self):
        await self._write_and_wait(GCODES['DEACTIVATE_ALL'])

    async def deactivate_lid(self) -> None:
        await self._write_and_wait(GCODES['DEACTIVATE_LID'])

    async def deactivate_block(self):
        await self._write_and_wait(GCODES['DEACTIVATE_BLOCK'])

    def is_connected(self) -> bool:
        if not self._poller:
            return False
        return self._poller.is_alive()

    async def open(self):
        await self._write_and_wait(GCODES['OPEN_LID'])
        self.lid_status = 'open'
        return self.lid_status

    async def close(self):
        await self._write_and_wait(GCODES['CLOSE_LID'])
        self.lid_status = 'closed'
        return self.lid_status

    async def set_temperature(self,
                              temp: float,
                              hold_time: float = None,
                              ramp_rate: float = None,
                              volume: float = None) -> None:
        if ramp_rate:
            ramp_cmd = f"{GCODES['SET_RAMP_RATE']} S{ramp_rate}"
            await self._write_and_wait(ramp_cmd)

        temp_cmd, temp = _build_temp_code(temp=temp,
                                          hold_time=hold_time,
                                          volume=volume)
        await self._write_and_wait(temp_cmd)
        retries = 0
        while (self._target_temp != temp) or (self._hold_time != hold_time):
            await asyncio.sleep(0.1)    # Wait for the poller to update
            retries += 1
            if retries > TEMP_UPDATE_RETRIES:
                break

    async def set_lid_temperature(self, temp: float) -> None:
        if temp is None:
            self._lid_target = LID_TARGET_DEFAULT
        else:
            if temp < LID_TARGET_MIN:
                self._lid_target = LID_TARGET_MIN
            elif temp > LID_TARGET_MAX:
                self._lid_target = LID_TARGET_MAX
            else:
                self._lid_target = temp

        lid_temp_cmd = '{} S{}'.format(GCODES['SET_LID_TEMP'],
                                       self._lid_target)
        await self._write_and_wait(lid_temp_cmd)

    def _lid_status_update_callback(self, lid_response):
        if lid_response:
            self._lid_status = utils.parse_string_value_from_substring(
                lid_response.split()[-1])

    def _temp_status_update_callback(self, temperature_response):
        # Payload is shaped like `T:95.0 C:77.4 H:600` where T is the
        # target temperature, C is the current temperature, and H is the
        # hold time remaining
        val_dict = {}
        data_substrs = [d for d in temperature_response.split()]

        for substr in data_substrs:
            key = utils.parse_key_from_substring(substr)
            value = utils.parse_number_from_substring(
                substr, utils.TC_GCODE_ROUNDING_PRECISION)
            val_dict[key] = value

        self._current_temp = val_dict['C']
        self._target_temp = val_dict['T']
        self._hold_time = val_dict['H']

    def _lid_temp_status_callback(self, lid_temp_res):
        # Payload is shaped like `T:95.0 C:77.4` where T is the
        # target temperature, C is the current temperature
        val_dict = {}
        data_substrs = [d for d in lid_temp_res.split()]

        for substr in data_substrs:
            key = utils.parse_key_from_substring(substr)
            value = utils.parse_number_from_substring(
                substr, utils.TC_GCODE_ROUNDING_PRECISION)
            val_dict[key] = value
        self._lid_temp = val_dict['C']
        self._lid_target = val_dict['T']

    def _interrupt_callback(self, interrupt_response):
        # TODO sanitize response and then call the callback
        parsed_response = interrupt_response
        self._interrupt_cb(parsed_response)

    @property
    def temperature(self):
        return self._current_temp

    @property
    def target(self):
        return self._target_temp

    @property
    def hold_time(self):
        return self._hold_time

    @property
    def ramp_rate(self):
        return self._ramp_rate

    @property
    def lid_temp_status(self):
        if self.lid_temp is None:
            _status = 'error'
        if self.lid_target is None:
            _status = 'idle'
        else:
            diff = self.lid_target - self.lid_temp
            if abs(diff) < TEMP_THRESHOLD:
                _status = 'holding at target'
            elif diff < 0:
                _status = 'idle'  # TC lid can't actively cool
            else:
                _status = 'heating'
        return _status

    @property
    def status(self):
        if self.temperature is None:
            _status = 'error'
        elif self.target is None:
            _status = 'idle'
        else:
            diff = self.target - self.temperature
            if abs(diff) < TEMP_THRESHOLD:
                _status = 'holding at target'
            elif diff < 0:
                _status = 'cooling'
            else:
                _status = 'heating'
        return _status

    @property
    def port(self) -> Optional[str]:
        if not self._poller:
            return None
        return self._poller.port

    @property
    def lid_status(self):
        return self._lid_status

    @lid_status.setter
    def lid_status(self, status):
        self._lid_status = status

    @property
    def lid_temp(self):
        return self._lid_temp

    @property
    def lid_target(self):
        return self._lid_target

    async def get_device_info(self) -> Mapping[str, str]:
        _device_info_res = await self._write_and_wait(GCODES['DEVICE_INFO'])
        if _device_info_res:
            return utils.parse_device_information(_device_info_res)
        else:
            raise ThermocyclerError("Thermocycler did not return device info")

    async def _write_and_wait(self, command):
        ret = None

        def cb(cmd):
            nonlocal ret
            ret = cmd

        self._poller.send(command, cb)

        while None is ret:
            await asyncio.sleep(0.05)
            pass
        return ret

    async def enter_programming_mode(self):
        trigger_connection = serial.Serial(
            self.port, TC_BOOTLOADER_BAUDRATE, timeout=1)
        log.info(
            f'in tc enter prg mode {self.port}, tctc: {trigger_connection}')
        await asyncio.sleep(0.05)
        trigger_connection.close()
        log.info(
            f'in tc after enter prg mode {self.port}, tctc: {trigger_connection}')

    def __del__(self):
        try:
            self._poller.close()
        except Exception:
            log.exception('Exception while cleaning up Thermocycler:')
