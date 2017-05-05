import time

from opentrons.util.log import get_logger


log = get_logger(__name__)


class Connection(object):

    def __init__(self, sp, port='', baudrate=115200, timeout=0.02):
        sp.port = port
        sp.baudrate = baudrate
        sp.timeout = timeout
        self.serial_port = sp

    def device(self):
        return self.serial_port

    def name(self):
        return str(self.serial_port.port)

    def open(self):
        if not self.serial_port.isOpen():
            self.serial_port.open()

    def close(self):
        if self.serial_port.isOpen():
            self.serial_port.close()

    def isOpen(self):
        return self.serial_port.isOpen()

    def serial_pause(self):
        time.sleep(self.serial_port.timeout)

    def wait_for_write(self):
        self.serial_port.flush()

    def data_available(self):
        return bool(self.serial_port.in_waiting)

    def flush_input(self):
        while self.data_available():
            self.serial_port.reset_input_buffer()
            self.serial_pause()

    def wait_for_data(self, timeout=30):
        end_time = time.time() + timeout
        while end_time > time.time():
            if self.data_available():
                return
        raise RuntimeWarning(
            'No data after {} second(s)'.format(timeout))

    def readline_string(self):
        return str(self.serial_port.readline().decode().strip())

    def write_string(self, data_string):
        self.serial_port.write(data_string.encode())
        self.wait_for_write()
