"""Radwag Scale Driver.

The driver allows a user to retrieve raw data
from the scale by using a USB connection.
Specify the port to establish Connection

Author: Carlos Fernandez
"""
import logging
from typing import Optional, List

import serial  # type: ignore[import]
import time
import re
from statistics import mode
from serial.serialutil import SerialException  # type: ignore[import]
import random

from serial.tools.list_ports import comports  # type: ignore[import]

log = logging.getLogger(__name__)


class RadwagScaleError(Exception):
    """Radwag exception."""

    def __init__(self, value: str) -> None:
        """Constructor."""
        self.value = value

    def __str__(self) -> str:
        """Convert to string."""
        return "Bad Scale Readings: " + repr(self.value)


class RadwagScale:
    """Radwag scale driver."""

    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600) -> None:
        """Constructor."""
        self.port = port
        self.baudrate = baudrate
        self.timeout = 0.1
        self.max_tries = 25
        self.total_reads = 10
        self.simulate = False
        self._scale: Optional[serial.Serial] = None
        self._time_delay = 0.3
        self._limit_sensor: Optional[serial.Serial] = None
        self._location = "NY"

    def scan_for_port(self, name: str) -> Optional[str]:
        """This function scans for these individual ports by VID:PID names."""
        # There may be something wrong with particle counter and robot port
        instruments = {"sensor": "USB VID:PID=1A86:7523"}
        port = None
        ports = comports()
        if name == "" or name is None:
            raise Exception("No instrument was named!")
        port_list = []
        for com_port, desc, hwid in sorted(ports):
            log.debug(f"{com_port}: {desc} [{hwid}]")
            port_list.append((com_port, desc, hwid))
        for vid in range(len(port_list)):
            if instruments[name] in port_list[vid][2]:
                port = port_list[vid][0]
        return port

    def connect(self) -> None:
        """Connect to the device."""
        if self.simulate:
            log.info("Virtual Scale Port Connected")
        else:
            log.info(f"Scale Connection established: {self.port}")
            self._connect_to_port()
            if self._location != "NY":
                self._limit_sensor = serial.Serial(
                    port=self.scan_for_port("sensor"),
                    baudrate=115200,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    bytesize=serial.EIGHTBITS,
                    timeout=0.1,
                )

    def _connect_to_port(self) -> None:
        """Connect to the port."""
        try:
            self._scale = serial.Serial(
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

    def read_mass(self, samples: int = 2, retry: int = 0) -> float:
        """Obtain a single reading of scale."""
        if not self.simulate:
            assert self._scale, "No connection"

            masses = []
            retry += 1
            try:
                for n in range(samples):
                    self._scale.flush()
                    self._scale.flushInput()
                    self._scale.write("SI\r\n".encode("utf-8"))
                    raw_val = self._scale.readline().strip()
                    log.debug(f"read mass response: {raw_val}")
                    (junk, val) = re.split("SI ", raw_val.decode("utf-8"))
                    if raw_val == "":
                        log.info("Not data retrieved")
                        self._scale.read_mass()
                    val = val.replace("SI", "")
                    val = val.replace("g", "")
                    val = val.replace("++", "+")
                    val = val.replace("--", "-")
                    val = val.replace("^", "")
                    val = val.replace("?", "")
                    data = float(val)
                    log.debug(f"read mass: {data}")
                    masses.append(data)

            except ValueError:
                if retry > 3:
                    raise RuntimeError("Scale is giving dirty output")
                else:
                    return self.read_mass(retry)

            masses = self.strip_outliners(masses)
            clean_average = sum(masses) / len(masses)
            log.debug(f"returning masses: {masses}")
            return clean_average
        else:
            return random.uniform(2.5, 2.7)

    def stable_read(self, samples: int = 10) -> float:
        """Take 10 samples due to stability of the scale."""
        if not self.simulate:
            assert self._scale, "No connection"

            masses = []
            stats_list = ["", "SU A", "ES", "SU E", "A"]
            for n in range(1, samples + 1):
                self._scale.flush()
                self._scale.flushInput()
                self._scale.flushOutput()
                condition = True
                while condition:
                    self._scale.write("SU\r\n".encode("utf-8"))
                    raw_val = self._scale.readline().decode("utf-8")
                    raw_val = raw_val.strip()
                    if raw_val in stats_list or "SU" not in raw_val:
                        time.sleep(0.4)
                    else:
                        condition = False
                sign = 1
                (junk, val) = re.split("SU ", raw_val)
                val = val.replace("g", "")
                # compensate for negative sign
                if val[2] == "-":
                    sign = -1
                    val = val.replace("-", "")
                val = float(val) * sign
                masses.append(val)
            # disregard readings and take 7-9 readings
            masses = masses[7:]
            masses = self.strip_outliners(masses)
            # Average the readings
            clean_average = sum(masses) / len(masses)
            return clean_average
        else:
            return random.uniform(2.5, 2.7)

    def read_continuous(self) -> float:  # noqa: C901
        """Read until 10 samples are received."""
        if not self.simulate:
            assert self._scale, "No connection"

            masses: List[float] = []
            while True:
                if len(masses) == 10:
                    break
                self._scale.flushInput()
                time.sleep(self._time_delay)
                condition = True
                times_count = 1
                self._scale.write("SU\r\n".encode("utf-8"))
                while condition:
                    time.sleep(self._time_delay)
                    raw_val = ""
                    for r in self._scale.readlines():
                        raw_val = raw_val + r.decode("utf-8").strip()
                    log.debug(f"read: {raw_val}")
                    raw_val = (
                        raw_val.replace("SU", " ")
                        .replace("A", " ")
                        .replace("ES", " ")
                        .replace("\n", " ")
                        .replace("\t", " ")
                        .replace("\r", " ")
                        .replace(" ", "")
                        .replace("g", "")
                    )
                    log.debug(
                        f"time_count: {times_count}, Raw scale reading: {raw_val}"
                    )
                    times_count = times_count + 1
                    if len(raw_val.replace("-", "").replace("E", "")) > 6:
                        self._scale.flushOutput()
                        condition = False
                    if "E" in raw_val or times_count % 110 == 0:
                        raw_val = raw_val.replace("E", "")
                        self._scale.flushInput()
                        time.sleep(self._time_delay)
                        self._scale.write("SU\r\n".encode("utf-8"))
                    if times_count % 250 == 0:
                        self.open_lid()
                        time.sleep(2)
                        self.close_lid()
                        time.sleep(2)
                    if times_count > 600:
                        raise Exception("Can't take reading")
                if times_count > 50:
                    masses = []
                if raw_val[0] == "-":
                    sign = -1
                    raw_val = raw_val.replace("-", "")
                    raw_val = str(float(raw_val) * sign)
                masses.append(float(raw_val))
            # disregard readings and take 7-9 readings
            masses = masses[7:]
            masses = self.strip_outliners(masses)
            # Average the readings
            clean_average = sum(masses) / len(masses)
            return clean_average
        else:
            time.sleep(0.5)
            return random.uniform(2.5, 2.7)

    def beep_scale(self) -> None:
        """Cause scale to beep."""
        assert self._scale, "No connection"
        self._scale.write("BP 500\r\n".encode("utf-8"))

    def open_lid(self) -> None:
        """Open the evaporation trap lid."""
        if not self.simulate:
            assert self._scale, "No connection"

            self._scale.flushInput()
            time.sleep(self._time_delay)
            self._scale.write("OC\r\n".encode("utf-8"))
            condition = True
            response = ""
            count = 1
            while condition:
                count = count + 1
                time.sleep(self._time_delay)
                for r in self._scale.readlines():
                    response = response + r.decode("utf-8").strip()
                log.debug(f"response from while loop 1: {response}")
                limit_state = self.checkLidStatus()
                log.debug(f"limit_state: {limit_state}")
                if "OK" in response and "OCOK" in limit_state:
                    log.debug("LID opened")
                    condition = False
                if "E" in response:
                    self._scale.write("CC\r\n".encode("utf-8"))
                if count > 20:
                    raise Exception("Open lid raise Error")
            time.sleep(1)
        else:
            log.debug("LID OPENED")

    def close_lid(self) -> None:
        """Close the evaporation trap lid."""
        if not self.simulate:
            assert self._scale, "No connection"

            self._scale.flushInput()
            time.sleep(self._time_delay)
            self._scale.write("CC\r\n".encode("utf-8"))
            condition = True
            response = ""
            count = 1
            while condition:
                count = count + 1
                time.sleep(self._time_delay)
                for r in self._scale.readlines():
                    response = response + r.decode("utf-8").strip()
                log.debug("fresponse from while loop 2: {response}")
                limit_state = self.checkLidStatus()
                log.debug(f"limit state: {limit_state}")
                if "OK" in response and "CCOK" in limit_state:
                    log.debug("LID Closed")
                    condition = False
                if "E" in response:
                    self._scale.write("CC\r\n".encode("utf-8"))
                if count > 10:
                    raise Exception("Close lid raise Error")
            time.sleep(1)
        else:
            log.debug("LID CLOSED")

    def open_chamber(self) -> None:
        """Open the glass enclosure door on the right side."""
        assert self._scale, "No connection"

        self._scale.flush()
        self._scale.flushInput()
        self._scale.flushOutput()
        self._scale.write("OD\r\n".encode("utf-8"))
        time.sleep(2)
        condition = True
        while condition:
            response = self._scale.readline().decode("utf-8")
            log.debug(f"response: {response}")
            if response == "":
                condition = False
            if response == "OD D\r\n":
                log.debug("LID already opened")
                condition = False
            elif response == "OD E\r\n":
                log.warning(
                    "Error in course of command execution, \
                                                no parameter or command format"
                )
            elif response == "OD A\r\n":
                log.debug("Command understood and in progress")
            else:
                raise Exception("Incorrect option {}".format(response))

    def close_chamber(self) -> None:
        """Close the glass enclosure door on the right side."""
        assert self._scale, "No connection"

        self._scale.flush()
        self._scale.flushInput()
        self._scale.flushOutput()
        self._scale.write("CD\r\n".encode("utf-8"))
        time.sleep(2)
        condition = True
        while condition:
            response = self._scale.readline().decode("utf-8")
            log.debug(f"response: {response}")
            if response == "":
                condition = False
            elif response == "CD D\r\n":
                log.debug("chamber already closed")
                condition = False
            elif response == "CD E\r\n":
                log.warning(
                    "Error in course of command execution, \
                                                no parameter or command format"
                )
            elif response == "CD A\r\n":
                log.debug("Command understood and in progress")
            else:
                raise Exception("Incorrect option {}".format(response))

    def checkLidStatus(self) -> str:
        """Check the lid status."""
        assert self._limit_sensor, "No connection"

        if self._location == "NY":
            res = "CCOK OCOK"
            return res
        self._limit_sensor.flush()
        self._limit_sensor.flushInput()
        self._limit_sensor.flushOutput()
        res = self._limit_sensor.readline().decode("utf-8").strip()
        log.debug(f"response: {res}")
        return res

    def profile_mode(self, mode_string: str) -> None:
        """Set the profile mode.

        There are four different profiles the user can choose from
        Fast, Fast dosing, Precision, and User. The input string needs to have
        the first letter of the word captial.
        """
        if not self.simulate:
            assert self._scale, "No connection"

            time.sleep(1)
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write("PROFILE {}\r\n".format(mode_string).encode("utf-8"))
            condition = True
            while condition:
                response = self._scale.readline().decode("utf-8")
                if response == "PROFILE OK\r\n":
                    log.debug(f"Profile set: {mode_string}, {response}")
                    condition = False
        else:
            response = "PROFILE OK\r\n"
            log.debug(f"Profile set: {mode_string}, {response}")

    @staticmethod
    def strip_outliners(masses: List[float]) -> List[float]:
        """Strip outliners."""
        rounded_masses = [round(mass) for mass in masses]
        mode_mass = mode(rounded_masses)
        outliers_stripped = [mass for mass in masses if abs(mass - mode_mass) < 1]
        return outliers_stripped

    def get_serial_number(self) -> str:
        """Get the device serial number."""
        if not self.simulate:
            assert self._scale, "No connection"
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write("NB\r\n".encode("utf-8"))
            response = self._scale.readline().decode("utf-8").strip()
            response = response.replace('"', "")
            response = response.replace(" ", "-")
            return response
        else:
            response = "NB-01-00101"
            return response

    def tare_scale(self) -> None:
        """Tare the scale."""
        if not self.simulate:
            assert self._scale, "No connection"
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write("T\r\n".encode("utf-8"))
            time.sleep(5)
        else:
            log.debug("SCALE HAS BEEN TARE")

    def disable_internal_adjustment(self) -> None:
        """Disable internal adjustments."""
        if not self.simulate:
            assert self._scale, "No connection"
            self._scale.flush()
            self._scale.flushInput()
            self._scale.flushOutput()
            self._scale.write("IC1\r\n".encode("utf-8"))
            time.sleep(5)
        else:
            log.debug("DISABLED INTERNAL ADJUSTMENT")


if __name__ == "__main__":
    com_port = "COM6"
    scale = RadwagScale(port=com_port)
    scale.simulate = False
    scale._location = "CH"
    scale.connect()

    while True:
        scale.close_lid()
        reading = scale.read_continuous()
        scale.open_lid()
        time.sleep(1)
