"""Pressure Fixture Driver."""
from abc import ABC, abstractmethod
from math import isfinite
from os.path import basename, realpath
import random
import re
from serial import Serial  # type: ignore[import]
from time import sleep
from typing import Any, Dict, List, Optional, Sequence, Tuple
from typing_extensions import Final, Literal

from hardware_testing.data import ui
from opentrons.types import Point

from serial.tools.list_ports import comports  # type: ignore[import]
from serial import SerialException
from hardware_testing.drivers import list_ports_and_select

FIXTURE_REBOOT_TIME = 2
FIXTURE_NUM_CHANNELS: Final[int] = 8
FIXTURE_BAUD_RATE: Final[int] = 115200
FIXTURE_VERSION_REQUIRED = "1.0.0"

FIXTURE_CMD_TERMINATOR = "\r\n"
FIXTURE_CMD_GET_VERSION = "VERSION"
FIXTURE_CMD_GET_ALL_PRESSURE = "GETPRESSURE:15"

LOCATION_A1_LEFT = Point(x=14.4, y=74.5, z=71.2)
LOCATION_A1_RIGHT = LOCATION_A1_LEFT._replace(x=128 - 14.4)


class PressureFixtureBase(ABC):
    """Base class for the OT3 pressure fixture driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """Preferred fixture USB identity; other USB interfaces are also supported."""
        # Prioritize the production fixture's Arduino Uno USB interface.
        return 0x2341, 0x0043

    @abstractmethod
    def connect(self) -> None:
        """Connect to the pressure fixture."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the pressure fixture."""
        ...

    @abstractmethod
    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        ...

    @abstractmethod
    def read_all_pressure_channel(self) -> List[float]:
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


def _connect_port(
    port: str, side: str, *, verify_pressure: bool = False
) -> "PressureFixture":
    """Open and validate a fixture, releasing its port on any unsuccessful exit."""
    fixture = PressureFixture.create(port=port, slot_side=side)
    try:
        fixture.connect()
        if verify_pressure:
            fixture.read_all_pressure_channel()
    except BaseException:
        # Clean up even when cancelled, then preserve the original exception.
        try:
            fixture.disconnect()
        except Exception:
            pass
        raise
    return fixture


def _usb_identity(port: Any) -> Tuple[Optional[int], Optional[int]]:
    """Read USB identity, including identities only present in a port's HWID."""
    vid = getattr(port, "vid", None)
    pid = getattr(port, "pid", None)
    vid = vid if isinstance(vid, int) else None
    pid = pid if isinstance(pid, int) else None
    match = re.search(
        r"\bVID:PID=([0-9a-f]{4}):([0-9a-f]{4})\b",
        str(getattr(port, "hwid", "")),
        re.IGNORECASE,
    )
    if match:
        if vid is None:
            vid = int(match[1], 16)
        if pid is None:
            pid = int(match[2], 16)
    return vid, pid


def _is_pressure_alias(device: str) -> bool:
    name = basename(device).lower()
    return "pressure" in name or "fixture" in name


def _fixture_candidate_ports(
    ports: Sequence[Any], excluded_ports: Sequence[str]
) -> List[str]:
    """Rank USB candidates after excluding known devices and grouping aliases."""
    excluded = {realpath(port) for port in excluded_ports}
    groups: Dict[str, List[Any]] = {}
    for port in ports:
        canonical = realpath(port.device)
        if canonical not in excluded:
            groups.setdefault(canonical, []).append(port)

    candidates: List[Tuple[bool, str]] = []
    for canonical, group in groups.items():
        identities = {_usb_identity(port) for port in group}
        if any(
            vid in (0xAC90, 0x1EAB)
            or (vid, pid) in ((0x04D8, 0xEF01), (0x0483, 0xA1AD))
            for vid, pid in identities
        ):
            continue

        metadata = " ".join(
            str(getattr(port, field, "") or "").lower()
            for port in group
            for field in (
                "device",
                "description",
                "product",
                "manufacturer",
                "interface",
            )
        )
        if any(
            identity in metadata
            for identity in (
                "barcode",
                "bar code",
                "scanner",
                "asair",
                "environment",
                "humidity",
            )
        ):
            continue

        if re.search(r"(?:^|[^a-z0-9])rear[\s_-]+panel(?:$|[^a-z0-9])", metadata):
            continue

        explicit_fixture = any(
            _is_pressure_alias(port.device) for port in group
        ) or any(
            re.search(
                r"(?:^|[^a-z0-9])pressure[\s_-]*fixture(?:$|[^a-z0-9])",
                str(getattr(port, field, "") or "").lower(),
            )
            for port in group
            for field in ("product", "description")
        )
        is_module = any(
            basename(port.device).lower().startswith("ot_module_")
            or "opentrons" in str(getattr(port, "manufacturer", "") or "").lower()
            for port in group
        )
        if is_module and not explicit_fixture:
            continue

        is_usb = any(
            vid is not None or pid is not None for vid, pid in identities
        ) or any(
            "usb" in str(getattr(port, "hwid", "") or "").lower() for port in group
        )
        if not is_usb:
            continue

        # Prefer a device alias, using its canonical entry's metadata above.
        preferred = min(
            group,
            key=lambda port: (
                port.device == canonical,
                not _is_pressure_alias(port.device),
                port.device,
            ),
        )
        candidates.append(
            (PressureFixture.vid_pid() not in identities, preferred.device)
        )
    return [device for _, device in sorted(candidates)]


def _connect_to_fixture_strict(
    side: str, excluded_ports: Sequence[str] = ()
) -> "PressureFixture":
    """Verify USB candidates without probing known other devices or prompting."""
    try:
        ports = list(comports(include_links=True))
    except Exception as error:
        raise SerialException(f"Cannot list pressure fixture ports: {error}") from error
    candidates = _fixture_candidate_ports(ports, excluded_ports)
    if not candidates:
        raise SerialException(
            "No eligible USB serial ports for a pressure fixture found. "
            "Connect the pressure fixture before starting QC."
        )

    failures = []
    for port in candidates:
        ui.print_info(f"Trying to connect to Pressure fixture on port {port}")
        try:
            fixture = _connect_port(port, side, verify_pressure=True)
        except Exception as error:
            failures.append(f"{port}: {error}")
            continue
        ui.print_info(f"Found fixture on port {port}")
        return fixture
    raise SerialException("Cannot connect to pressure fixture: " + "; ".join(failures))


def connect_to_fixture(
    simulate: bool,
    side: str = "left",
    autosearch: bool = True,
    *,
    strict: bool = False,
    excluded_ports: Sequence[str] = (),
) -> PressureFixtureBase:
    """Connect to a fixture or explicitly simulate it.

    Strict mode excludes other known devices and verifies firmware plus pressure
    data. Known USB identity is preferred, with other USB serial ports as fallback.
    It never prompts or falls back to simulation, and takes precedence over
    autosearch. Excluded ports and their aliases are never probed in strict mode.
    Existing non-strict callers retain interactive discovery.
    """
    ui.print_title("Connecting to pressure fixture")
    if not simulate:
        if strict:
            return _connect_to_fixture_strict(side, excluded_ports)
        if not autosearch:
            port = list_ports_and_select(device_name="Pressure fixture")
            fixture = _connect_port(port, side)
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
                    fixture = _connect_port(port, side)
                    ui.print_info(f"Found fixture on port {port}")
                    return fixture
                except Exception:
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
        """Create a pressure fixture driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = FIXTURE_BAUD_RATE
        conn.timeout = 1
        return PressureFixture(connection=conn, slot_side=slot_side)

    def connect(self) -> None:
        """Connect."""
        self._port.open()
        self._port.flushInput()  # type: ignore[attr-defined]
        # NOTE: device might take a few seconds to boot up
        sleep(FIXTURE_REBOOT_TIME)
        fw_version = self.firmware_version()
        if fw_version != FIXTURE_VERSION_REQUIRED:
            raise SerialException(
                f"Unexpected pressure-fixture version: {fw_version!r}; "
                f"expected {FIXTURE_VERSION_REQUIRED!r}"
            )

    def disconnect(self) -> None:
        """Disconnect."""
        self._port.close()

    def firmware_version(self) -> str:
        """Read the firmware version from the device."""
        cmd_str = f"{FIXTURE_CMD_GET_VERSION}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        return self._port.readline().decode("utf-8").strip()

    def read_all_pressure_channel(self) -> List[float]:
        """Read eight ordered, labeled, finite pressure values from the fixture."""
        cmd_str = f"{FIXTURE_CMD_GET_ALL_PRESSURE}{FIXTURE_CMD_TERMINATOR}"
        self._port.write(cmd_str.encode("utf-8"))
        try:
            response = self._port.readline().decode("utf-8").strip()
        except UnicodeDecodeError as error:
            raise SerialException("Invalid pressure response encoding.") from error
        fields = response.split(",")
        if fields[-1] == "":
            fields.pop()  # Firmware may include a single trailing comma.
        if len(fields) != FIXTURE_NUM_CHANNELS:
            raise SerialException(
                "Pressure response must contain exactly eight channels."
            )
        data = []
        for channel, field in enumerate(fields, start=1):
            label, separator, value_text = field.strip().partition("=")
            if not separator or label.strip() != f"PRESSURE{channel}":
                raise SerialException(
                    f"Expected PRESSURE{channel} in ordered pressure response."
                )
            try:
                value = float(value_text.strip())
            except ValueError as error:
                raise SerialException(
                    f"Invalid PRESSURE{channel} value in pressure response."
                ) from error
            if not isfinite(value):
                raise SerialException(f"PRESSURE{channel} must be finite.")
            data.append(0.0 if value == 0.0 else value)
        if self._slot_side == "left":
            data.reverse()  # reverse order, so pipette channel 1 is at index 0
        return data


if __name__ == "__main__":
    port_name = input("type the port of the device (eg: COM1): ")
    fixture = PressureFixture.create(port=port_name, slot_side="left")
    fixture.connect()
    print(f"Device firmware version: {fixture.firmware_version()}")
    while True:
        readings = fixture.read_all_pressure_channel()
        print(readings)
        sleep(0.1)
