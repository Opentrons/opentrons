"""Pressure Fixture Driver."""
from abc import ABC, abstractmethod
import random
from serial import Serial  # type: ignore[import]
from time import sleep
from typing import List, Tuple
from typing_extensions import Final, Literal

from hardware_testing.data import ui
from opentrons.types import Point

from serial.tools.list_ports import comports  # type: ignore[import]
from serial import SerialException
from hardware_testing.drivers import list_ports_and_select

FIXTURE_REBOOT_TIME = 2
FIXTURE_NUM_CHANNELS: Final[int] = 8
FIXTURE_NUM_CHANNELS_96: Final[int] = 96
FIXTURE_BAUD_RATE: Final[int] = 115200
FIXTURE_VERSION_REQUIRED = "1.0.0"
FIXTURE_VERSION_REQUIRED2 = "0.0.1"

FIXTURE_CMD_TERMINATOR = "\r\n"
FIXTURE_CMD_GET_VERSION = "VERSION"
FIXTURE_CMD_GET_ALL_PRESSURE = "GETPRESSURE:15"
FIXTURE_CMD_GET_ALL_PRESSURE_96 = "GETPRESSURE:255"

LOCATION_A1_LEFT = Point(x=14.4, y=74.5, z=71.2)
LOCATION_A1_RIGHT = LOCATION_A1_LEFT._replace(x=128 - 14.4)


class PressureFixtureBase(ABC):
    """Base Class if Mark10 Force Gauge Driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """OT3 Pressure Fixture VID:PID."""
        # Check what's the VID and PID for this device
        return 0x0483, 0xA1AD

    @abstractmethod
    def connect(self) -> None:
        """Connect to the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def connect_96(self) -> None:
        """Connect to the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the Mark10 Force Gauge."""
        ...

    @abstractmethod
    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        ...

    @abstractmethod
    def read_all_pressure_channel(self) -> List[float]:
        """Read all pressure channels on fixture in Pascals."""
        ...
    @abstractmethod
    def read_all_pressure_channel_96(self) -> List[float]:
        """Read all pressure channels on fixture in Pascals."""
        ...


    def position_in_slot(self, side: Literal["left", "right"] = "left") -> Point:
        """Position in slot."""
        if side == "left":
            return LOCATION_A1_LEFT
        else:
            return LOCATION_A1_RIGHT

    @property
    def depth(self) -> float:
        """Depth."""
        return 14.0

    @property
    def tip_volume(self) -> int:
        """Tip Volume."""
        return 50

    @property
    def aspirate_volume(self) -> float:
        """Aspirate Volume."""
        return 20.0


class SimPressureFixture(PressureFixtureBase):
    """Simulating OT3 Pressure Fixture Driver."""

    def __init__(self, slot_side: str = "left") -> None:
        """Simulation of Pressure Fixture."""
        self._slot_side = slot_side

    def connect(self) -> None:
        """Connect."""
        return

    def connect_96(self) -> None:
        """Connect."""
        return

    def disconnect(self) -> None:
        """Disconnect."""
        return

    def firmware_version(self) -> str:
        """Firmware version."""
        return FIXTURE_VERSION_REQUIRED

    def read_all_pressure_channel(self) -> List[float]:
        """Read Pressure for all channels."""
        pressure = [random.uniform(2.5, 2) for _ in range(FIXTURE_NUM_CHANNELS)]
        return pressure
    def read_all_pressure_channel_96(self) -> List[float]:
        """Read Pressure for all channels."""
        pressure = [random.uniform(2.5, 2) for _ in range(FIXTURE_NUM_CHANNELS_96)]
        return pressure


def connect_to_fixture(
    simulate: bool, side: str = "left", autosearch: bool = True
) -> PressureFixtureBase:
    """Try to find and return an presure fixture, if not found return a simulator."""
    ui.print_title("Connecting to presure fixture")
    if not simulate:
        if not autosearch:
            port = list_ports_and_select(device_name="Pressure fixture")
            fixture = PressureFixture.create(port=port, slot_side=side)
            fixture.connect()
            ui.print_info(f"Found fixture on port {port}")
            return fixture
        else:
            ports = comports()
            assert ports
            for _port in ports:
                port = _port.device  # type: ignore[attr-defined]
                try:
                    ui.print_info(
                        f"Trying to connect to Pressure fixture on port {port}"
                    )
                    fixture = PressureFixture.create(port=port, slot_side=side)
                    fixture.connect()
                    ui.print_info(f"Found fixture on port {port}")
                    return fixture
                except:  # noqa: E722
                    pass
            use_sim = ui.get_user_answer("No pressure sensor found, use simulator?")
            if not use_sim:
                raise SerialException("No sensor found")
    ui.print_info("no fixture found returning simulator")
    return SimPressureFixture()

def connect_to_fixture96(
    simulate: bool, side: str = "left", autosearch: bool = True
) -> PressureFixtureBase:
    """Try to find and return an presure fixture, if not found return a simulator."""
    ui.print_title("Connecting to presure fixture")
    if not simulate:
        if not autosearch:
            port = list_ports_and_select(device_name="Pressure fixture")
            fixture = PressureFixture.create(port=port, slot_side=side)
            fixture.connect_96()
            ui.print_info(f"Found fixture on port {port}")
            return fixture
        else:
            ports = comports()
            assert ports
            for _port in ports:
                port = _port.device  # type: ignore[attr-defined]
                try:
                    ui.print_info(
                        f"Trying to connect to Pressure fixture on port {port}"
                    )
                    fixture = PressureFixture.create(port=port, slot_side=side)
                    fixture.connect_96()
                    ui.print_info(f"Found fixture on port {port}")
                    return fixture
                except:  # noqa: E722
                    pass
            use_sim = ui.get_user_answer("No pressure sensor found, use simulator?")
            if not use_sim:
                raise SerialException("No sensor found")
    ui.print_info("no fixture found returning simulator")
    return SimPressureFixture()

class PressureFixture(PressureFixtureBase):
    """OT3 Pressure Fixture Driver."""

    def __init__(self, connection: Serial, slot_side: str) -> None:
        """Constructor."""
        self._port = connection
        assert slot_side in ["left", "right"], f"Unexpected slot side: {slot_side}"
        self._slot_side = slot_side

    @classmethod
    def create(cls, port: str, slot_side: str = "left") -> "PressureFixture":
        """Create a Radwag scale driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = FIXTURE_BAUD_RATE
        conn.timeout = 1
        return PressureFixture(connection=conn, slot_side=slot_side)

    def connect(self) -> None:
        """Connect."""
        self._port.open()
        self._port.flushInput()
        # NOTE: device might take a few seconds to boot up
        sleep(FIXTURE_REBOOT_TIME)
        fw_version = self.firmware_version()
        print(f"unexpected pressure-fixture version: {fw_version}")
        assert (
            fw_version == FIXTURE_VERSION_REQUIRED
        ), f"unexpected pressure-fixture version: {fw_version}"

    def connect_96(self) -> None:
        """Connect."""
        self._port.open()
        self._port.flushInput()
        # NOTE: device might take a few seconds to boot up
        sleep(FIXTURE_REBOOT_TIME)
        fw_version = self.firmware_version()
        print(f"unexpected pressure-fixture version: {fw_version}")
        assert (
            fw_version == FIXTURE_VERSION_REQUIRED2
        ), f"unexpected pressure-fixture version: {fw_version}"

    def disconnect(self) -> None:
        """Disconnect."""
        self._port.close()

    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        cmd_str = f"{FIXTURE_CMD_GET_VERSION}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        return self._port.readline().decode("utf-8").strip()

    def read_all_pressure_channel(self) -> List[float]:
        """Reads from all the channels from the fixture."""
        cmd_str = f"{FIXTURE_CMD_GET_ALL_PRESSURE}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        response = self._port.readline().decode("utf-8")
        res_list = response.split(",")[:-1]  # ignore the last comma
        data_str = [d.split("=")[-1].strip() for d in res_list]  # remove PRESSURE=
        for i in range(len(data_str)):  # replace all -0.00 with 0.00
            if data_str[i] == "-0.00":
                data_str[i] = "0.00"
        data = [float(d) for d in data_str]  # convert to float
        if self._slot_side == "left":
            data.reverse()  # reverse order, so pipette channel 1 is at index 0
        return data

    def read_all_pressure_channel_96(self) -> List[float]:
        """Reads from all the channels from the fixture."""
        cmd_str = f"{FIXTURE_CMD_GET_ALL_PRESSURE_96}{FIXTURE_CMD_TERMINATOR}"
        last_error = ValueError("No 96-channel pressure data received from fixture.")
        for _ in range(3):
            self._port.reset_input_buffer()
            self._port.write(cmd_str.encode("utf-8"))
            response = self._port.readlines()
            datalist = []
            for res in response:
                decoded = res.decode("utf-8").strip()
                if not decoded:
                    continue
                res_list = decoded.split(",")[:-1]  # ignore the last comma
                data_str = [d.split("=")[-1].strip() for d in res_list]
                for i in range(len(data_str)):
                    if data_str[i] == "-0.00":
                        data_str[i] = "0.00"
                try:
                    data = [float(d) for d in data_str]
                except ValueError as err:
                    last_error = ValueError(
                        f"Invalid 96-channel pressure response line: {decoded}"
                    )
                    break
                datalist = data + datalist
            if len(datalist) == FIXTURE_NUM_CHANNELS_96:
                return datalist
            last_error = ValueError(
                f"Expected {FIXTURE_NUM_CHANNELS_96} pressure values, got {len(datalist)}"
            )
        raise last_error
    def print_pressure_datas(self,data_list):
        row_labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        col_labels = list(range(1, 13))
        cell_width = 9

        # 打印表头
        print(" " * 3 + "".join(f"{col:>{cell_width}}" for col in col_labels))

        # 打印每一行
        for i in range(8):
            row_data = data_list[i * 12:(i + 1) * 12]
            row_str = f"{row_labels[i]}: "
            for val in row_data:
                try:
                    row_str += f"{float(val):>{cell_width}.2f}"
                except:
                    row_str += f"{str(val):>{cell_width}}"
            print(row_str)


if __name__ == "__main__":
    port_name = list_ports_and_select(device_name="Pressure fixture")
    #port_name = input("type the port of the device (eg: COM1): ")
    fixture = PressureFixture.create(port=port_name, slot_side="left")
    fixture.connect_96()
    print(f"Device firmware version: {fixture.firmware_version()}")
    while True:
        readings = fixture.read_all_pressure_channel_96()
        print("zuihoujieguo:",readings)
        fixture.print_pressure_datas(readings)
        sleep(0.1)
