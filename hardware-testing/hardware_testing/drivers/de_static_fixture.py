"""De-Static Fixture Driver."""
from abc import ABC, abstractmethod
from serial import Serial  # type: ignore[import]
from serial.tools.list_ports import comports
from time import sleep
from typing_extensions import Final, Optional, cast

from . import search_for_port_with_filter, list_ports_and_select


FIXTURE_BAUD_RATE: Final[int] = 115200
FIXTURE_CMD_GET_IS_ENABLED = "?"
FIXTURE_CMD_SET_ENABLE = "enable"
FIXTURE_RESPONSE_ENABLED = "on"
FIXTURE_RESPONSE_DISABLED = "off"


class DeStaticFixtureBase(ABC):
    """Base Class if DeStaticFixture."""

    @abstractmethod
    def connect(self) -> None:
        """Connect to the USB serial port."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the USB serial port."""
        ...

    @abstractmethod
    def is_enabled(self) -> bool:
        """Read status of de-static bar power."""
        ...

    @abstractmethod
    def enable_power_for_one_second(self) -> None:
        """Enable power for just 1x second."""
        ...


class SimDeStaticFixture(DeStaticFixtureBase):
    """Simulating DeStaticFixture."""

    def connect(self) -> None:
        """Connect to the USB serial port."""
        return

    def disconnect(self) -> None:
        """Disconnect from the USB serial port."""
        return

    def is_enabled(self) -> bool:
        """Read status of de-static bar power."""
        return False

    def enable_power_for_one_second(self) -> None:
        """Enable power for just 1x second."""
        return


class DeStaticFixture(DeStaticFixtureBase):
    """Simulating DeStaticFixture."""

    def __init__(self, port_name: str) -> None:
        """Constructor."""
        self._port: Serial = Serial()
        self._port.timeout = 1.0
        self._port.port = port_name
        self._port.baudrate = FIXTURE_BAUD_RATE

    def connect(self) -> None:
        """Connect to the USB serial port."""
        if not self._port.is_open:
            self._port.open()

    def disconnect(self) -> None:
        """Disconnect from the USB serial port."""
        if self._port.is_open:
            self._port.close()

    def is_enabled(self) -> bool:
        """Read status of de-static bar power."""
        self._port.write(FIXTURE_CMD_GET_IS_ENABLED.encode("utf-8"))
        res = self._port.readline().decode("utf-8").strip().lower()
        if res == FIXTURE_RESPONSE_ENABLED:
            return True
        elif res == FIXTURE_RESPONSE_DISABLED:
            return False
        else:
            raise ValueError(f"unexpected response: {res}")

    def enable_power_for_one_second(self) -> None:
        """Enable power for just 1x second."""
        self._port.write(FIXTURE_CMD_SET_ENABLE.encode("utf-8"))
        sleep(0.1)
        assert self.is_enabled()


def find_and_build(simulate: bool) -> DeStaticFixtureBase:
    """Build."""
    if simulate:
        return SimDeStaticFixture()
    available_port_names = [p.device for p in comports()]
    bar: Optional[DeStaticFixture] = None
    for port_name in available_port_names:
        try:
            bar = DeStaticFixture(port_name=port_name)
            bar.connect()
            bar.is_enabled()
            return cast(DeStaticFixture, bar)
        except Exception as e:
            print(e)
            continue
        finally:
            if bar:
                bar.disconnect()
    raise RuntimeError(f"unable to find de-static bar on USB ports: {available_port_names}")
