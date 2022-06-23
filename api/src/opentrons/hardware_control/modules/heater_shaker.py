import asyncio
import logging
from anyio import create_task_group
from dataclasses import dataclass
from typing import Optional, Mapping, Callable
from typing_extensions import Final
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.heater_shaker.driver import HeaterShakerDriver
from opentrons.drivers.heater_shaker.abstract import AbstractHeaterShakerDriver
from opentrons.drivers.heater_shaker.simulator import SimulatingDriver
from opentrons.drivers.types import Temperature, RPM, HeaterShakerLabwareLatchStatus
from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.poller import Reader, WaitableListener, Poller
from opentrons.hardware_control.modules import mod_abc, update
from opentrons.hardware_control.modules.types import (
    TemperatureStatus,
    SpeedStatus,
    HeaterShakerStatus,
    UploadFunction,
    LiveData,
)

log = logging.getLogger(__name__)

POLL_PERIOD = 1.0

# TODO(mc, 2022-06-14): this techinque copied from temperature module
# to speed up simulation of heater-shaker protocols, but it's pretty silly
# module simulation in PAPIv2 needs to be seriously rethought
SIMULATING_POLL_PERIOD = POLL_PERIOD / 20.0


class HeaterShakerError(RuntimeError):
    """An error propagated from the heater-shaker module."""


class HeaterShaker(mod_abc.AbstractModule):
    """Heater-Shaker module class"""

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
    ) -> "HeaterShaker":
        """
        Build a HeaterShaker

        Args:
            port: The port to connect to
            usb_port: USB Port
            execution_manager: Execution manager.
            simulating: whether to build a simulating driver
            loop: Loop
            sim_model: The model name used by simulator
            polling_period: the polling period in seconds
            kwargs: further kwargs are in starargs because of inheritance rules.
            possible values include polling_period: float, a time in seconds to poll

        Returns:
            HeaterShaker instance
        """
        driver: AbstractHeaterShakerDriver
        if not simulating:
            driver = await HeaterShakerDriver.create(port=port, loop=loop)
            polling_period = kwargs.get("polling_period", POLL_PERIOD)
        else:
            driver = SimulatingDriver()
            polling_period = SIMULATING_POLL_PERIOD

        mod = cls(
            port=port,
            usb_port=usb_port,
            execution_manager=execution_manager,
            driver=driver,
            device_info=await driver.get_device_info(),
            loop=loop,
            polling_period=polling_period,
        )
        return mod

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        driver: AbstractHeaterShakerDriver,
        device_info: Mapping[str, str],
        polling_period: float,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ):
        super().__init__(
            port=port, usb_port=usb_port, loop=loop, execution_manager=execution_manager
        )
        self._device_info = device_info
        self._driver = driver
        self._listener = HeaterShakerListener(loop=loop)
        self._poller = Poller(
            reader=PollerReader(driver=self._driver),
            interval_seconds=polling_period,
            listener=self._listener,
        )
        # TODO (spp, 2022-02-23): refine this to include user-facing error message.
        self._error_status: Optional[str] = None

    async def cleanup(self) -> None:
        """Stop the poller task"""
        await self._poller.stop_and_wait()

    @classmethod
    def name(cls) -> str:
        """Used for picking up serial port symlinks"""
        return "heatershaker"

    @staticmethod
    def _model_from_revision(revision: Optional[str]) -> str:
        """Defines the revision -> model mapping"""
        return "heaterShakerModuleV1"

    @staticmethod
    def _get_temperature_status(temperature: Temperature) -> TemperatureStatus:
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
    def _get_speed_status(speed: RPM) -> SpeedStatus:
        """
        Determine the status from the speed.

        Args:
            speed: An RPM instance

        Returns:
            The status
        """
        DELTA: Final = 100
        status = SpeedStatus.IDLE
        if speed.target is not None:
            diff = speed.target - speed.current
            if abs(diff) < DELTA:  # To avoid status fluctuation near target
                status = SpeedStatus.HOLDING
            elif diff < 0:
                status = SpeedStatus.DECELERATING
            else:
                status = SpeedStatus.ACCELERATING
        return status

    def model(self) -> str:
        return self._model_from_revision(self._device_info.get("model"))

    def bootloader(self) -> UploadFunction:
        return update.upload_via_dfu

    async def wait_next_poll(self) -> None:
        """Wait for the next poll to complete."""
        await self._listener.wait_next_poll()

    @property
    def device_info(self) -> Mapping[str, str]:
        return self._device_info

    @property
    def live_data(self) -> LiveData:
        return {
            # TODO (spp, 2022-2-22): Revise what status includes
            "status": self.status.value,
            "data": {
                "temperatureStatus": self.temperature_status.value,
                "speedStatus": self.speed_status.value,
                "labwareLatchStatus": self.labware_latch_status.value,
                "currentTemp": self.temperature,
                "targetTemp": self.target_temperature,
                "currentSpeed": self.speed,
                "targetSpeed": self.target_speed,
                "errorDetails": self._error_status,
            },
        }

    @property
    def temperature(self) -> float:
        return self._listener.state.temperature.current

    @property
    def target_temperature(self) -> Optional[float]:
        return self._listener.state.temperature.target

    @property
    def speed(self) -> int:
        return self._listener.state.rpm.current

    @property
    def target_speed(self) -> Optional[int]:
        return self._listener.state.rpm.target

    @property
    def temperature_status(self) -> TemperatureStatus:
        return self._get_temperature_status(self._listener.state.temperature)

    @property
    def speed_status(self) -> SpeedStatus:
        return self._get_speed_status(self._listener.state.rpm)

    @property
    def labware_latch_status(self) -> HeaterShakerLabwareLatchStatus:
        return self._listener.state.labware_latch

    @property
    def status(self) -> HeaterShakerStatus:
        """Module status or error state details."""
        # TODO (spp, 2022-2-22): Does this make sense as the overarching 'status'?
        #  Or maybe consolidate the above 3 statuses into this one?
        if (
            self.temperature_status == TemperatureStatus.IDLE
            and self.speed_status == SpeedStatus.IDLE
        ):
            return HeaterShakerStatus.IDLE
        elif self._error_status:
            # TODO (spp, 2022-02-23): actually implement error checking
            return HeaterShakerStatus.ERROR
        else:
            return HeaterShakerStatus.RUNNING

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    # TODO(mc, 2022-06-14): not used, remove
    async def set_temperature(self, celsius: float) -> None:
        """
        Set temperature in degree Celsius

        Range: Room temperature to 90 degree Celsius
               Any temperature above the value will be clipped to
               the nearest limit. This is a resistive heater, not
               a Peltier TEC, so a temperature that is too low
               may be unattainable but we do not limit input on the
               low side in case the user has this in a freezer.

        This function will not complete until the heater-shaker is at
        the requested temperature or an error occurs. To start heating
        but not wait until heating is complete, see start_set_temperature.
        """
        await self.wait_for_is_running()
        await self._driver.set_temperature(temperature=celsius)
        await self.wait_next_poll()

        async def _wait() -> None:
            # Wait until we reach the target temperature.
            while self.temperature_status != TemperatureStatus.HOLDING:
                await self.wait_next_poll()

        task = self._loop.create_task(_wait())
        self.make_cancellable(task)
        await task

    async def start_set_temperature(self, celsius: float) -> None:
        """
        Set temperature in degree Celsius

        Range: Room temperature to 90 degree Celsius
               Any temperature above the value will be clipped to
               the nearest limit. This is a resistive heater, not
               a Peltier TEC, so a temperature that is too low
               may be unattainable but we do not limit input on the
               low side in case the user has this in a freezer.

        This function will complete as soon as heating begins, and
        will not wait until the temperature is achieved. To then wait
        until heating is complete, use await_temperature. To start
        heating and wait until heating is complete in one call, use
        set_temperature.

        """
        await self.wait_for_is_running()

        # TODO(mc, 2022-06-14); this common "set and wait for the next poll" pattern
        # exists so `self.target_...`  immediately after a `_driver.set_...` works.
        # This is fraught, and probably still open to race conditions.
        # Re-think this pattern, potentially even at the driver/firmware level
        await self._driver.set_temperature(celsius)
        await self.wait_next_poll()

    async def await_temperature(self, awaiting_temperature: float) -> None:
        """Await temperature in degree Celsius.

        Polls temperature module's current temperature until
        the specified temperature is reached.
        """
        if self.is_simulated:
            return

        await self.wait_for_is_running()
        await self.wait_next_poll()

        # TODO(mc, 2022-06-14): wait logic disagrees with `self.set_temperature`.
        # Resolve discrepency whichever way is most correct
        async def _await_temperature() -> None:
            if self.temperature_status == TemperatureStatus.HEATING:
                while self.temperature < awaiting_temperature:
                    await self.wait_next_poll()
            elif self.temperature_status == TemperatureStatus.COOLING:
                while self.temperature > awaiting_temperature:
                    await self.wait_next_poll()

        t = self._loop.create_task(_await_temperature())
        self.make_cancellable(t)
        await t

    async def set_speed(self, rpm: int) -> None:
        """
        Set shake speed in RPM

        Range: 0-3000 RPM
               Any speed above or below these values will cause an error.

        This function will not complete until the heater-shaker is at
        the speed or an error occurs. To start spinning but not wait
        until the final speed is reached, see start_set_speed.
        """
        await self.wait_for_is_running()
        await self._driver.set_rpm(rpm)
        await self.wait_next_poll()

        async def _wait() -> None:
            # Wait until we reach the target speed.
            while self.speed_status != SpeedStatus.HOLDING:
                await self.wait_next_poll()

        task = self._loop.create_task(_wait())
        self.make_cancellable(task)
        await task

    # TODO(mc, 2022-06-14): not used, remove
    async def start_set_speed(self, rpm: int) -> None:
        """
        Set shake speed in RPM

         Range: 0-3000 RPM
                Any speed above or below these values will cause an
                error

         This function will complete after the heater-shaker begins
         to accelerate. To wait until the speed is reached, use
         await_speed. To set speed and wait in the same call, see
         set_speed.
        """
        await self.wait_for_is_running()
        await self._driver.set_rpm(rpm)

    # TODO(mc, 2022-06-14): not used, remove
    async def await_speed(self, awaiting_speed: int) -> None:
        """Wait until specified RPM speed is reached.

        Polls heater-shaker module's current speed until awaiting_speed is achieved.
        """
        if self.is_simulated:
            return

        await self.wait_for_is_running()
        await self.wait_next_poll()

        async def _await_speed() -> None:
            if self.speed_status == SpeedStatus.ACCELERATING:
                while self.speed < awaiting_speed:
                    await self.wait_next_poll()
            elif self.speed_status == SpeedStatus.DECELERATING:
                while self.speed > awaiting_speed:
                    await self.wait_next_poll()

        t = self._loop.create_task(_await_speed())
        self.make_cancellable(t)
        await t

    # TODO(mc, 2022-06-14): not used, remove
    async def await_speed_and_temperature(self, temperature: float, speed: int) -> None:
        """Wait for previously-started speed and temperature commands to complete.

        To set speed, use start_set_speed. To set temperature,
        use start_set_temperature.
        """
        async with create_task_group() as tg:  # Does task cleanup
            tg.start_soon(self.await_speed, speed)
            tg.start_soon(self.await_temperature, temperature)

    async def _wait_for_labware_latch(
        self, status: HeaterShakerLabwareLatchStatus
    ) -> None:
        """Wait until the hardware reports the labware latch status matches."""
        while self.labware_latch_status != status:
            await self.wait_next_poll()

    async def deactivate(self) -> None:
        """Stop heating/cooling; stop shaking and home the plate"""
        await self.wait_for_is_running()
        await self._driver.deactivate_heater()
        await self._driver.home()
        await self.wait_next_poll()

    async def deactivate_heater(self) -> None:
        """Stop heating/cooling"""
        await self.wait_for_is_running()
        await self._driver.deactivate_heater()
        await self.wait_next_poll()

    async def deactivate_shaker(self) -> None:
        """Stop shaking and home the plate"""
        await self.wait_for_is_running()
        await self._driver.home()
        await self.wait_next_poll()

    async def open_labware_latch(self) -> None:
        await self.wait_for_is_running()
        await self._driver.open_labware_latch()
        await self._wait_for_labware_latch(HeaterShakerLabwareLatchStatus.IDLE_OPEN)

    async def close_labware_latch(self) -> None:
        await self.wait_for_is_running()
        await self._driver.close_labware_latch()
        await self._wait_for_labware_latch(HeaterShakerLabwareLatchStatus.IDLE_CLOSED)

    async def prep_for_update(self) -> str:
        return "no"


@dataclass
class PollResult:
    temperature: Temperature
    rpm: RPM
    labware_latch: HeaterShakerLabwareLatchStatus


class PollerReader(Reader[PollResult]):
    """Polled data reader."""

    def __init__(self, driver: AbstractHeaterShakerDriver) -> None:
        """Constructor."""
        self._driver = driver

    async def read(self) -> PollResult:
        """Poll the heater-shaker."""

        return PollResult(
            temperature=await self._driver.get_temperature(),
            rpm=await self._driver.get_rpm(),
            labware_latch=await self._driver.get_labware_latch_status(),
        )


class HeaterShakerListener(WaitableListener[PollResult]):
    """Heater-Shaker state listener."""

    def __init__(
        self,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        interrupt_callback: Optional[Callable[[Exception], None]] = None,
    ) -> None:
        """Constructor."""
        super().__init__(loop=loop)
        self._callback = interrupt_callback
        self._polled_data = PollResult(
            temperature=Temperature(current=25, target=None),
            rpm=RPM(current=0, target=None),
            labware_latch=HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN,
        )

    @property
    def state(self) -> PollResult:
        return self._polled_data

    def on_poll(self, result: PollResult) -> None:
        """On new poll."""
        self._polled_data = result
        return super().on_poll(result)

    def on_error(self, exc: Exception) -> None:
        """On error."""
        if self._callback:
            self._callback(exc)
