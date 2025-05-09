"""De-Static Fixture Driver."""
from abc import ABC, abstractmethod
from serial import Serial  # type: ignore[import]
from serial.tools.list_ports import comports  # type: ignore[import]
from time import sleep, time
from typing_extensions import Final, Optional, cast, List, Any


FIXTURE_BAUD_RATE: Final[int] = 115200
FIXTURE_CMD_GET_IS_ENABLED = "?"
FIXTURE_CMD_SET_ENABLE = "enable"
FIXTURE_RESPONSE_ENABLED = "on"
FIXTURE_RESPONSE_DISABLED = "off"

_DELAY_SECONDS: float = 0.1


class DeStaticFixtureBase(ABC):
    """Base Class if DeStaticFixture."""

    @abstractmethod
    def is_simulating(self) -> bool:
        """Is simulating."""
        ...

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

    @abstractmethod
    def wait_for_disabled(self, timeout: float = 2.0) -> None:
        """Wait for disabled."""
        ...


class SimDeStaticFixture(DeStaticFixtureBase):
    """Simulating DeStaticFixture."""

    def __init__(self) -> None:
        """Constructor."""
        self._connected: bool = False

    def is_simulating(self) -> bool:
        return True

    def connect(self) -> None:
        """Connect to the USB serial port."""
        self._connected = True

    def disconnect(self) -> None:
        """Disconnect from the USB serial port."""
        self._connected = True

    def is_enabled(self) -> bool:
        """Read status of de-static bar power."""
        assert self._connected
        return False

    def enable_power_for_one_second(self) -> None:
        """Enable power for just 1x second."""
        assert self._connected

    def wait_for_disabled(self, timeout: float = 2.0) -> None:
        """Wait for disabled."""
        return


class DeStaticFixture(DeStaticFixtureBase):
    """Simulating DeStaticFixture."""

    def __init__(self, port_name: str) -> None:
        """Constructor."""
        self._port: Serial = Serial()
        self._port.timeout = 1.0
        self._port.port = port_name
        self._port.baudrate = FIXTURE_BAUD_RATE

    def is_simulating(self) -> bool:
        return False

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
        sleep(_DELAY_SECONDS)
        assert self.is_enabled()

    def wait_for_disabled(self, timeout: float = 2.0) -> None:
        """Wait for disabled."""
        start = time()
        while time() - start > timeout and self.is_enabled():
            sleep(_DELAY_SECONDS)
        assert not self.is_enabled(), (
            f"timed out after {timeout} seconds "
            f"waiting for de-static fixture to disable"
        )


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
    raise RuntimeError(
        f"unable to find de-static bar on USB ports: {available_port_names}"
    )


if __name__ == "__main__":
    bar = find_and_build(simulate=False)
    bar.connect()
    start_time = time()

    def _print(*args: Any) -> None:
        print(round(time() - start_time, 2), *args)

    try:
        while True:
            _print("is enabled?", bar.is_enabled())
            _print("sending enable command...")
            bar.enable_power_for_one_second()
            _print("is enabled?", bar.is_enabled())
            bar.wait_for_disabled()
            _print("is enabled?", bar.is_enabled())
            sleep(1)
    finally:
        bar.disconnect()
