"""Asair sensor driver.

This libray is for the temperature and humidity sensor used with the
pipette gravimetric fixture. The sensor outputs temperature and
relative humidity that is recorded onto the pipette results.
"""

import codecs
import csv
import logging
import os
import random
import time
from datetime import datetime
from typing import Tuple, Optional

import serial  # type: ignore[import]
from serial.serialutil import SerialException  # type: ignore[import]

log = logging.getLogger(__name__)


addrs = {
    "01": "C40B",
    "02": "C438",
    "03": "C5E9",
    "04": "C45E",
    "05": "C58F",
    "06": "C5BC",
    "07": "C46D",
    "08": "C492",
    "09": "C543",
    "10": "C74A",
}


class AsairSensorError(Exception):
    """Asair sensor error."""

    def __init__(self, ret_code: str = None) -> None:
        """Constructor."""
        super().__init__(ret_code)


class AsairSensor:
    """Asair sensor driver."""

    def __init__(
        self, port: str = "/dev/ttyUSB0", baudrate: int = 9600, timeout: float = 5
    ) -> None:
        """Constructor."""
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.sensor_addr = "01"
        self.simulate = False
        self._th_sensor: Optional[serial.Serial] = None

    def connect(self) -> None:
        """Connect to sensor."""
        if self.simulate:
            log.info("Virtual Temp sensor Port Connected")
        else:
            log.info("TH Sensor Connection established: {self.port}")
            self._connect_to_port()

    def _connect_to_port(self) -> None:
        """Allows you to connect to a virtual port or port."""
        try:
            self._th_sensor = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=self.timeout,
            )
        except SerialException:
            error_msg = "\nUnable to access Serial port to Scale: \n"
            error_msg += "1. Check that the scale is plugged into the computer. \n"
            error_msg += "2. CHeck if the assigned port is correct. \n"
            raise SerialException(error_msg)

    def get_reading(self) -> Tuple[float, float]:
        """Get a reading."""
        if not self.simulate:
            assert self._th_sensor, "No connection"

            data_packet = "{}0300000002{}".format(
                self.sensor_addr, addrs[self.sensor_addr]
            )
            log.debug(f"sending {data_packet}")
            command_bytes = codecs.decode(data_packet.encode(), "hex")
            count = 0
            try:
                count += 1
                self._th_sensor.flushInput()
                self._th_sensor.flushOutput()
                self._th_sensor.write(command_bytes)
                time.sleep(0.1)
                length = self._th_sensor.inWaiting()
                if count == self.timeout:
                    raise RuntimeError("TH SENSOR TIMEOUT")
                res = self._th_sensor.read(length)
                log.debug(f"received {res}")
                res = codecs.encode(res, "hex")
                temp = res[6:10]
                relative_hum = res[10:14]
                log.info(f"Temp: {temp}, RelativeHum: {relative_hum}")
                temp = float(int(temp, 16)) / 10
                relative_hum = float(int(relative_hum, 16)) / 10
                return temp, relative_hum

            except AsairSensorError as th_error:
                self._th_sensor.close()
                log.exception("Error Occurred")
                raise AsairSensorError(str(th_error))

            except SerialException:
                error_msg = "Asair Sensor not connected "
                error_msg += "or check if Port number is correct!. "
                raise SerialException(error_msg)
        else:
            temp = random.uniform(24.5, 25)
            relative_hum = random.uniform(45, 40)
            return temp, relative_hum


if __name__ == "__main__":
    TH = AsairSensor(port="COM12")
    while True:
        ##########################################
        # make a dir
        ##########################################
        D = datetime.now().strftime("%y-%m-%d")
        folder_name = os.path.join("", D)
        if not os.path.exists(folder_name):
            os.makedirs(folder_name)
        ##########################################
        # compile csv file
        ##########################################
        file_name = folder_name + ".csv"
        hours = os.listdir(folder_name)
        print(hours)
        with open(file_name, "w", newline="") as f:
            writer = csv.writer(f, delimiter=",", quoting=csv.QUOTE_NONE)
            for h in hours:
                hour_path = os.path.join(folder_name, h)
                print(hour_path)
                f = open(hour_path, "r", newline="")
                csv_f = csv.reader(f)
                for row in csv_f:
                    writer.writerow(row)
        ##########################################
        # get read from sensor
        ##########################################
        T = datetime.now().strftime("%H")
        with open("./{}/{}.csv".format(D, T), "a+", newline="") as f:
            writer = csv.writer(f, delimiter=",", quoting=csv.QUOTE_NONE)
            while True:
                now = datetime.now().strftime("%H:%M:%S")
                if T not in now:
                    break
                h1, t1 = TH.get_reading()
                print("Time: {}, t1={},h1={}".format(now, t1, h1))
                time.sleep(2)
