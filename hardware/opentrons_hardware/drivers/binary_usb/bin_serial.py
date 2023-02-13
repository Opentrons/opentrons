"""The usb binary protocol over serial transport."""

import serial
from serial.tools import list_ports


class SerialUsbDriver():
	"""The usb binary protocol interface."""
	def __init__(self, vid, pid) -> None:
		self._port_name = self._find_serial_port(vid, pid, baudrate = 115200, timeout = 1)
		if self._port_name is None:
			raise IOError("unable to find serial device")
		
		self._port = serial.Serial(self._port_name, baudrate, timeout = timeout)
		
	def _find_serial_port(self, vid, pid):
        """Find a serial port by VID, PID and text name

        :param vid: USB vendor ID to locate
        :param pid: USB product ID to locate
        :param name: USB device name to find where VID/PID match fails

        """

        check_for = "USB VID:PID={vid:04x}:{pid:04x}".format(vid=vid,pid=pid).upper()
        ports = serial.tools.list_ports.comports()

        for check_port in ports:
            if hasattr(serial.tools,'list_ports_common'):
                if (check_port.vid, check_port.pid) == (VID, PID):
                    return check_port.device
                continue
        return None
        
    def write(self, binary_data):
		return self._port.write(binary_data)
	
	def read(self, size = 64)
		return self._port.read(size=size)

	def __exit__(self):
		self._port.close()
