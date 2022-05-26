"""Radwag Scale Driver.

The driver allows a user to retrieve raw data
from the scale by using a USB connection.
Specify the port to establish Connection

Author: Carlos Fernandez
"""
import abc
import logging
from typing import Optional, List
from typing_extensions import Final

import serial  # type: ignore[import]
import time
import re
from statistics import mode
from serial.serialutil import SerialException  # type: ignore[import]
import random
from abc import ABC

from hardware_testing.drivers.limit_sensor import LimitSensorBase, SimLimitSensor

log = logging.getLogger(__name__)


class RadwagScaleError(Exception):
    """Radwag exception."""

    def __init__(self, value: str) -> None:
        """Constructor."""
        self.value = value

    def __str__(self) -> str:
        """Convert to string."""
        return "Bad Scale Readings: " + repr(self.value)


class RadwagScaleBase(ABC):
    """Abstract Radwag scale driver."""

    @abc.abstractmethod
    def read_mass(self, samples: int = 2, retry: int = 0) -> float:
        """Read mass."""
        ...

    @abc.abstractmethod
    def stable_read(self, samples: int = 10) -> float:
        """Stable read."""
        ...

    @abc.abstractmethod
    def read_continuous(self) -> float:
        """Read until samples are received."""
        ...

    @abc.abstractmethod
    def open_lid(self) -> None:
        """Open the evaporation trap lid."""
        ...

    @abc.abstractmethod
    def close_lid(self) -> None:
        """Close the evaporation trap lid."""
        ...

    @abc.abstractmethod
    def open_chamber(self) -> None:
        """Open the glass enclosure door on the right side."""
        ...

    @abc.abstractmethod
    def close_chamber(self) -> None:
        """Close the glass enclosure door on the right side."""
        ...

    @abc.abstractmethod
    def profile_mode(self, mode_string: str) -> None:
        """Set the profile mode.

        There are four different profiles the user can choose from
        Fast, Fast dosing, Precision, and User. The input string needs to have
        the first letter of the word capitalized.
        """
        ...

    @abc.abstractmethod
    def get_serial_number(self) -> str:
        """Get the device serial number."""
        ...

    @abc.abstractmethod
    def tare_scale(self) -> None:
        """Tare the scale."""
        ...

    @abc.abstractmethod
    def disable_internal_adjustment(self) -> None:
        """Disable internal adjustments."""
        ...


class RadwagScale(RadwagScaleBase):
    """Radwag scale driver."""

    def __init__(
        self,
        connection: serial.Serial,
        time_delay: float,
        limit_sensor: LimitSensorBase,
    ) -> None:
        """Constructor."""
        self._scale = connection
        self._time_delay = time_delay
        self._limit_sensor = limit_sensor

    @classmethod
    def create(
        cls,
        port: str,
        baudrate: int = 9600,
        timeout: float = 0.1,
        time_delay: float = 0.3,
        limit_sensor: Optional[LimitSensorBase] = None,
    ) -> "RadwagScale":
        """Connect to the port."""
        try:
            limit_sensor = limit_sensor or SimLimitSensor()
            conn = serial.Serial(
                port=port,
                baudrate=baudrate,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=timeout,
            )
            return RadwagScale(
                connection=conn, time_delay=time_delay, limit_sensor=limit_sensor
            )
        except SerialException:
            error_msg = (
                "\nUnable to access Serial port to Scale: \n"
                "1. Check that the scale is plugged into the computer. \n"
                "2. Check if the assigned port is correct. \n"
            )
            raise SerialException(error_msg)

    def read_mass(self, samples: int = 2, retry: int = 0) -> float:
        """Obtain a single reading of scale."""
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

    def stable_read(self, samples: int = 10) -> float:
        """Take samples due to stability of the scale."""
        masses = []
        stats_list = ["", "SU A", "ES", "SU E", "A"]
        for n in range(samples):
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
        # disregard all but the final X readings
        num_samples_to_drop: Final[int] = 3
        if samples > num_samples_to_drop:
            masses = masses[samples - num_samples_to_drop :]
        masses = self.strip_outliners(masses)
        # Average the readings
        clean_average = sum(masses) / len(masses)
        return clean_average

    def read_continuous(self) -> float:  # noqa: C901
        """Read until 10 samples are received."""
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
                # TODO (amit, 2022-05-26): why is this a loop that creates a
                #  string of many responses?
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
                log.debug(f"time_count: {times_count}, Raw scale reading: {raw_val}")
                times_count = times_count + 1
                # TODO (amit, 2022-05-26): Why 6?
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

    def open_lid(self) -> None:
        """Open the evaporation trap lid."""
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
            if "OK" in response and self._limit_sensor.is_open():
                log.debug("LID opened")
                condition = False
            if "E" in response:
                self._scale.write("CC\r\n".encode("utf-8"))
            if count > 20:
                raise Exception("Open lid raise Error")

    def close_lid(self) -> None:
        """Close the evaporation trap lid."""
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
            log.debug(f"response from while loop 2: {response}")
            if "OK" in response and self._limit_sensor.is_closed():
                log.debug("LID Closed")
                condition = False
            if "E" in response:
                self._scale.write("CC\r\n".encode("utf-8"))
            if count > 10:
                raise Exception("Close lid raise Error")

    def open_chamber(self) -> None:
        """Open the glass enclosure door on the right side."""
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
                raise Exception(f"Incorrect option {response}")

    def close_chamber(self) -> None:
        """Close the glass enclosure door on the right side."""
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

    def profile_mode(self, mode_string: str) -> None:
        """Set the profile mode.

        There are four different profiles the user can choose from
        Fast, Fast dosing, Precision, and User. The input string needs to have
        the first letter of the word captial.
        """
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

    @staticmethod
    def strip_outliners(masses: List[float]) -> List[float]:
        """Strip outliners."""
        rounded_masses = [round(mass) for mass in masses]
        mode_mass = mode(rounded_masses)
        outliers_stripped = [mass for mass in masses if abs(mass - mode_mass) < 1]
        return outliers_stripped

    def get_serial_number(self) -> str:
        """Get the device serial number."""
        self._scale.flush()
        self._scale.flushInput()
        self._scale.flushOutput()
        self._scale.write("NB\r\n".encode("utf-8"))
        response = self._scale.readline().decode("utf-8").strip()
        response = response.replace('"', "")
        response = response.replace(" ", "-")
        return response

    def tare_scale(self) -> None:
        """Tare the scale."""
        self._scale.flush()
        self._scale.flushInput()
        self._scale.flushOutput()
        self._scale.write("T\r\n".encode("utf-8"))
        time.sleep(5)

    def disable_internal_adjustment(self) -> None:
        """Disable internal adjustments."""
        self._scale.flush()
        self._scale.flushInput()
        self._scale.flushOutput()
        self._scale.write("IC1\r\n".encode("utf-8"))
        time.sleep(5)


class SimRadwagScale(RadwagScaleBase):
    """Simulating Radwag scale driver."""

    def read_mass(self, samples: int = 2, retry: int = 0) -> float:
        """Obtain a single reading of scale."""
        return random.uniform(2.5, 2.7)

    def stable_read(self, samples: int = 10) -> float:
        """Simulate taking 10 samples due to stability of the scale."""
        return random.uniform(2.5, 2.7)

    def read_continuous(self) -> float:
        """Read until 10 samples are received."""
        time.sleep(0.5)
        return random.uniform(2.5, 2.7)

    def open_lid(self) -> None:
        """Open the evaporation trap lid."""
        log.debug("LID OPENED")

    def close_lid(self) -> None:
        """Close the evaporation trap lid."""
        log.debug("LID CLOSED")

    def open_chamber(self) -> None:
        """Open the glass enclosure door on the right side."""
        log.debug("CHAMBER OPENED")

    def close_chamber(self) -> None:
        """Close the glass enclosure door on the right side."""
        log.debug("CHAMBER CLOSED")

    def profile_mode(self, mode_string: str) -> None:
        """Set the profile mode.

        There are four different profiles the user can choose from
        Fast, Fast dosing, Precision, and User. The input string needs to have
        the first letter of the word captial.
        """
        response = "PROFILE OK\r\n"
        log.debug(f"Profile set: {mode_string}, {response}")

    def get_serial_number(self) -> str:
        """Get the device serial number."""
        return "NB-01-00101"

    def tare_scale(self) -> None:
        """Tare the scale."""
        log.debug("SCALE HAS BEEN TARE")

    def disable_internal_adjustment(self) -> None:
        """Disable internal adjustments."""
        log.debug("DISABLED INTERNAL ADJUSTMENT")
