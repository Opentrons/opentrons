import time
import logging

from serial import SerialException  # type: ignore

log = logging.getLogger(__name__)


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
        if self.serial_port.isOpen():
            self.serial_port.close()
        self.serial_port.open()

    def close(self):
        self.serial_port.close()

    def isOpen(self):
        return self.serial_port.isOpen()

    def serial_pause(self):
        time.sleep(self.serial_port.timeout)

    def data_available(self):
        return int(self.serial_port.in_waiting)

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

    def readline_string(self, timeout=30):
        end_time = time.time() + timeout
        while end_time > time.time():
            self.wait_for_data(timeout=timeout)
            try:
                res = str(self.serial_port.readline().decode().strip())
            except SerialException:
                self.close()
                self.open()
                return self.readline_string(timeout=end_time - time.time())
            if res:
                return res
        raise RuntimeWarning(
            'No new line from Smoothie after {} second(s)'.format(timeout))

    def write_string(self, data_string):
        self.serial_port.write(data_string.encode())
        self.serial_port.flush()
