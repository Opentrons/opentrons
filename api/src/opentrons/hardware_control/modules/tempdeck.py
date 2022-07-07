import asyncio
import logging
from typing import Mapping, Optional

from opentrons.hardware_control.modules.types import TemperatureStatus
from opentrons.hardware_control.poller import Reader, WaitableListener, Poller
from typing_extensions import Final
from opentrons.drivers.types import Temperature
from opentrons.drivers.temp_deck import (
    SimulatingDriver,
    AbstractTempDeckDriver,
    TempDeckDriver,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.modules import update, mod_abc, types

log = logging.getLogger(__name__)

TEMP_POLL_INTERVAL_SECS = 1.0
SIM_TEMP_POLL_INTERVAL_SECS = TEMP_POLL_INTERVAL_SECS / 20.0


class TempDeck(mod_abc.AbstractModule):
    """
    Under development. API subject to change without a version bump
    """

    FIRST_GEN2_REVISION = 20

    @classmethod
    async def build(
        cls,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        simulating: bool = False,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        sim_model: Optional[str] = None,
        **kwargs: float,
    ) -> "TempDeck":
        """
        Build a TempDeck

        Args:
            port: The port to connect to
            usb_port: USB Port
            execution_manager: Execution manager.
            simulating: whether to build a simulating driver
            loop: Loop
            sim_model: The model name used by simulator
            **kwargs: Module specific values.
                can be 'polling_frequency' to specify the polling frequency in
                seconds

        Returns:
            Tempdeck instance
        """
        polling_frequency = kwargs.get("polling_frequency")
        driver: AbstractTempDeckDriver
        if not simulating:
            driver = await TempDeckDriver.create(port=port, loop=loop)
            polling_frequency = polling_frequency or TEMP_POLL_INTERVAL_SECS
        else:
            driver = SimulatingDriver(sim_model=sim_model)
            polling_frequency = polling_frequency or SIM_TEMP_POLL_INTERVAL_SECS

        mod = cls(
            port=port,
            usb_port=usb_port,
            execution_manager=execution_manager,
            driver=driver,
            device_info=await driver.get_device_info(),
            loop=loop,
            polling_frequency=polling_frequency,
        )
        return mod

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        driver: AbstractTempDeckDriver,
        device_info: Mapping[str, str],
        loop: Optional[asyncio.AbstractEventLoop] = None,
        polling_frequency: float = TEMP_POLL_INTERVAL_SECS,
    ) -> None:
        """Constructor"""
        super().__init__(
            port=port, usb_port=usb_port, loop=loop, execution_manager=execution_manager
        )
        self._device_info = device_info
        self._driver = driver
        self._listener = TempdeckListener(loop=loop)
        self._poller = Poller(
            reader=PollerReader(driver=self._driver),
            interval_seconds=polling_frequency,
            listener=self._listener,
        )

    async def cleanup(self) -> None:
        """Stop the poller task."""
        await self._poller.stop_and_wait()
        await self._driver.disconnect()

    @classmethod
    def name(cls) -> str:
        return "tempdeck"

    def model(self) -> str:
        return self._model_from_revision(self._device_info.get("model"))

    def bootloader(self) -> types.UploadFunction:
        return update.upload_via_avrdude

    async def wait_next_poll(self) -> None:
        """Wait for the next poll to complete."""
        await self._listener.wait_next_poll()

    async def set_temperature(self, celsius: float) -> None:
        """
        Set temperature in degree Celsius
        Range: 4 to 95 degree Celsius (QA tested).
        The internal temp range is -9 to 99 C, which is limited by the 2-digit
        temperature display. Any input outside of this range will be clipped
        to the nearest limit
        """
        await self.wait_for_is_running()
        await self._driver.set_temperature(celsius=celsius)
        await self.wait_next_poll()

        async def _wait() -> None:
            # Wait until we reach the target temperature.
            while self.status != TemperatureStatus.HOLDING:
                await self.wait_next_poll()

        task = self._loop.create_task(_wait())
        self.make_cancellable(task)
        await task

    async def start_set_temperature(self, celsius: float) -> None:
        """
        Set temperature in degree Celsius
        Range: 4 to 95 degree Celsius (QA tested).
        The internal temp range is -9 to 99 C, which is limited by the 2-digit
        temperature display. Any input outside of this range will be clipped
        to the nearest limit
        """
        await self.wait_for_is_running()
        await self._driver.set_temperature(celsius)

    async def await_temperature(self, awaiting_temperature: float) -> None:
        """
        Await temperature in degree Celsius
        Polls temperature module's temperature until
        the specified temperature is reached
        """
        if self.is_simulated:
            return

        await self.wait_for_is_running()
        await self.wait_next_poll()

        async def _await_temperature() -> None:
            if self.status == TemperatureStatus.HEATING:
                while self.temperature < awaiting_temperature:
                    await self.wait_next_poll()
            elif self.status == TemperatureStatus.COOLING:
                while self.temperature > awaiting_temperature:
                    await self.wait_next_poll()

        t = self._loop.create_task(_await_temperature())
        self.make_cancellable(t)
        await t

    async def deactivate(self) -> None:
        """Stop heating/cooling and turn off the fan"""
        await self.wait_for_is_running()
        await self._driver.deactivate()

    @property
    def device_info(self) -> Mapping[str, str]:
        return self._device_info

    @property
    def live_data(self) -> types.LiveData:
        return {
            "status": self.status,
            "data": {"currentTemp": self.temperature, "targetTemp": self.target},
        }

    @property
    def temperature(self) -> float:
        return self._listener.state.current

    @property
    def target(self) -> Optional[float]:
        return self._listener.state.target

    @property
    def status(self) -> str:
        return self._get_status(self._listener.state).value

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    async def prep_for_update(self) -> str:
        model = self._device_info and self._device_info.get("model")
        if model in ("temp_deck_v1", "temp_deck_v1.1", "temp_deck_v2"):
            raise types.UpdateError(
                "This Temperature Module can't be updated."
                "Please contact Opentrons Support."
            )
        await self._poller.stop_and_wait()
        await self._driver.enter_programming_mode()
        new_port = await update.find_bootloader_port()
        return new_port or self.port

    def has_available_update(self) -> bool:
        """Override of abc implementation to suppress update notifications
        for v1, v1.1, and v2 temperature modules which cannot be updated"""
        if not self._device_info:
            model = None
        else:
            model = self._device_info.get("model")
        if model in {"temp_deck_v1", "temp_deck_v1.1", "temp_deck_v2", None}:
            return False
        return super().has_available_update()

    @staticmethod
    def _get_status(temperature: Temperature) -> TemperatureStatus:
        """
        Determine the status from the temperature.

        Args:
            temperature: A Temperature instance

        Returns:
            The status
        """
        DELTA: Final = 0.7
        status = TemperatureStatus.IDLE
        if temperature.target is not None:
            diff = temperature.target - temperature.current
            if abs(diff) < DELTA:  # To avoid status fluctuation near target
                status = TemperatureStatus.HOLDING
            elif diff < 0:
                status = TemperatureStatus.COOLING
            else:
                status = TemperatureStatus.HEATING
        return status

    @staticmethod
    def _model_from_revision(revision: Optional[str]) -> str:
        """Defines the revision -> model mapping"""
        if not revision or "v" not in revision:
            log.error(f"bad revision: {revision}")
            return "temperatureModuleV1"
        try:
            revision_num = float(revision.split("v")[-1])
        except (ValueError, TypeError):
            # none or corrupt
            log.exception("no revision")
            return "temperatureModuleV1"

        if revision_num < TempDeck.FIRST_GEN2_REVISION:
            return "temperatureModuleV1"
        else:
            return "temperatureModuleV2"


class PollerReader(Reader[Temperature]):
    """Polled data reader."""

    def __init__(self, driver: AbstractTempDeckDriver) -> None:
        """Constructor."""
        self._driver = driver

    async def read(self) -> Temperature:
        """Poll the tempdeck."""
        return await self._driver.get_temperature()


class TempdeckListener(WaitableListener[Temperature]):
    """Tempdeck state listener."""

    def __init__(
        self,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        """Constructor."""
        super().__init__(loop=loop)
        self._polled_data = Temperature(current=25, target=None)

    @property
    def state(self) -> Temperature:
        return self._polled_data

    def on_poll(self, result: Temperature) -> None:
        """On new poll."""
        self._polled_data = result
        return super().on_poll(result)

    def on_error(self, exc: Exception) -> None:
        """On error."""
        super().on_error(exc)
