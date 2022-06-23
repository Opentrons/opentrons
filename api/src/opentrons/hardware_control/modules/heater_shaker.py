import asyncio
import logging
from anyio import create_task_group
from dataclasses import dataclass
from contextlib import contextmanager
from typing import Optional, Mapping, Callable, Tuple, Iterator, Type
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

POLL_PERIOD = 1


class HeaterShakerError(RuntimeError):
    """An error propagated from the heater-shaker module."""


class HeaterShaker(mod_abc.AbstractModule):
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
        else:
            driver = SimulatingDriver()
        mod = cls(
            port=port,
            usb_port=usb_port,
            execution_manager=execution_manager,
            driver=driver,
            device_info=await driver.get_device_info(),
            loop=loop,
            polling_period=kwargs.get("polling_period"),
        )
        return mod

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        driver: AbstractHeaterShakerDriver,
        device_info: Mapping[str, str],
        loop: Optional[asyncio.AbstractEventLoop] = None,
        polling_period: Optional[float] = None,
    ):
        super().__init__(
            port=port, usb_port=usb_port, loop=loop, execution_manager=execution_manager
        )
        poll_time_s = polling_period or POLL_PERIOD
        self._device_info = device_info
        self._driver = driver

        self._listener = HeaterShakerListener(
            loop=loop, interrupt_callback=self._poll_exc_handler
        )

        self._poller = Poller(
            reader=PollerReader(driver=self._driver),
            interval_seconds=poll_time_s,
            listener=self._listener,
        )
        # TODO (spp, 2022-02-23): refine this to include user-facing error message.
        self._error_status: Optional[str] = None

    def _poll_exc_handler(self, exc: Exception) -> None:
        log.error(exc)
        self._error_status = self._exc_to_errorstr(exc)

    @staticmethod
    def _exc_to_errorstr(exc: Exception) -> str:
        try:
            return str(exc.args[0])
        except Exception:
            return repr(exc)

    @contextmanager
    def _guard_exc_to_error_state(
        self,
        catchlist: Optional[Tuple[Type[Exception]]] = None,
        ignorelist: Optional[Tuple[Type[Exception]]] = None,
    ) -> Iterator[None]:
        """Turn an exception into an error state and reraise.

        If specified, catchlist makes this only handle the specified
        exception types.

        If specified, ignorelist makes this handle any exception type
        not in ignorelist.

        If both are specified, catchlist takes precedence and ignorelist
        is ignored.

        If neither is specified, all exceptions are handled.

        Handling is done with isinstance checks, so inserting an exception
        widely used as a base class in either list may be a bad idea.
        """
        try:
            yield
        except Exception as exc:
            if catchlist and isinstance(exc, catchlist):
                self._error_status = self._exc_to_errorstr(exc)
            elif ignorelist and not isinstance(exc, ignorelist):
                self._error_status = self._exc_to_errorstr(exc)
            elif (catchlist == None) and (ignorelist == None):
                self._error_status = self._exc_to_errorstr(exc)
            raise

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
        if self._error_status:
            return HeaterShakerStatus.ERROR
        elif (
            self.temperature_status == TemperatureStatus.IDLE
            and self.speed_status == SpeedStatus.IDLE
        ):
            return HeaterShakerStatus.IDLE
        else:
            return HeaterShakerStatus.RUNNING

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    async def set_temperature(self, celsius: float) -> None:
        """
        Set temperature in degree Celsius

        Range: Room temperature to 90 degree Celsius
               Any temperature above the value will be clipped to
               the nearest limit. This is a resistive heater, not
               a Peltier TEC, so a temperature that is too low
               may be unattainable but we do not limit input on the
               low side in case the user has this in a freezer.

        This function will not complete until the heater/shaker is at
        the requested temperature or an error occurs. To start heating
        but not wait until heating is complete, see start_set_temperature.
        """

        async def _wait() -> None:
            # Wait until we reach the target temperature.
            while self.temperature_status != TemperatureStatus.HOLDING:
                await self.wait_next_poll()

        with self._guard_exc_to_error_state(ignorelist=(asyncio.CancelledError,)):
            await self.wait_for_is_running()
            await self._driver.set_temperature(temperature=celsius)
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
        with self._guard_exc_to_error_state():
            await self.wait_for_is_running()
            await self._driver.set_temperature(celsius)

    async def await_temperature(self, awaiting_temperature: float) -> None:
        """Await temperature in degree Celsius.

        Polls temperature module's current temperature until
        the specified temperature is reached.
        """
        if self.is_simulated:
            return

        async def _await_temperature() -> None:
            if self.temperature_status == TemperatureStatus.HEATING:
                while self.temperature < awaiting_temperature:
                    await self.wait_next_poll()
            elif self.temperature_status == TemperatureStatus.COOLING:
                while self.temperature > awaiting_temperature:
                    await self.wait_next_poll()

        with self._guard_exc_to_error_state(ignorelist=(asyncio.CancelledError,)):
            await self.wait_for_is_running()
            await self.wait_next_poll()

            t = self._loop.create_task(_await_temperature())
            self.make_cancellable(t)
            await t

    async def set_speed(self, rpm: int) -> None:
        """
        Set shake speed in RPM

        Range: 0-3000 RPM
               Any speed above or below these values will cause an error.

        This function will not complete until the heater/shaker is at
        the speed or an error occurs. To start spinning but not wait
        until the final speed is reached, see start_set_speed.
        """

        async def _wait() -> None:
            # Wait until we reach the target speed.
            while self.speed_status != SpeedStatus.HOLDING:
                await self.wait_next_poll()

        with self._guard_exc_to_error_state(ignorelist=(asyncio.CancelledError,)):
            await self.wait_for_is_running()
            await self._driver.set_rpm(rpm)
            await self.wait_next_poll()

            task = self._loop.create_task(_wait())
            self.make_cancellable(task)
            await task

    async def start_set_speed(self, rpm: int) -> None:
        """
        Set shake speed in RPM

         Range: 0-3000 RPM
                Any speed above or below these values will cause an
                error

         This function will complete after the heater/shaker begins
         to accelerate. To wait until the speed is reached, use
         await_speed. To set speed and wait in the same call, see
         set_speed.
        """
        with self._guard_exc_to_error_state():
            await self.wait_for_is_running()
            await self._driver.set_rpm(rpm)

    async def await_speed(self, awaiting_speed: int) -> None:
        """Wait until specified RPM speed is reached.

        Polls heater/shaker module's current speed until awaiting_speed is achieved.
        """
        if self.is_simulated:
            return

        async def _await_speed() -> None:
            if self.speed_status == SpeedStatus.ACCELERATING:
                while self.speed < awaiting_speed:
                    await self.wait_next_poll()
            elif self.speed_status == SpeedStatus.DECELERATING:
                while self.speed > awaiting_speed:
                    await self.wait_next_poll()

        with self._guard_exc_to_error_state(ignorelist=(asyncio.CancelledError,)):
            await self.wait_for_is_running()
            await self.wait_next_poll()

            t = self._loop.create_task(_await_speed())
            self.make_cancellable(t)
            await t

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
        # TODO (spp, 2022-02-22): use the labware_latch_status property to get ll status
        current_status = await self._driver.get_labware_latch_status()
        while status != current_status:
            current_status = await self._driver.get_labware_latch_status()

    async def deactivate(self) -> None:
        """Stop heating/cooling; stop shaking and home the plate"""
        with self._guard_exc_to_error_state():
            await self.wait_for_is_running()
            await self._driver.deactivate_heater()
            await self._driver.home()
            await self.wait_next_poll()

    async def deactivate_heater(self) -> None:
        """Stop heating/cooling"""
        with self._guard_exc_to_error_state():
            await self.wait_for_is_running()
            await self._driver.deactivate_heater()
            await self.wait_next_poll()

    async def deactivate_shaker(self) -> None:
        """Stop shaking and home the plate"""
        with self._guard_exc_to_error_state():
            await self.wait_for_is_running()
            await self._driver.home()
            await self.wait_next_poll()

    async def open_labware_latch(self) -> None:
        with self._guard_exc_to_error_state():
            await self.wait_for_is_running()
            await self._driver.open_labware_latch()
            await self._wait_for_labware_latch(HeaterShakerLabwareLatchStatus.IDLE_OPEN)

    async def close_labware_latch(self) -> None:
        with self._guard_exc_to_error_state():
            await self.wait_for_is_running()
            await self._driver.close_labware_latch()
            await self._wait_for_labware_latch(
                HeaterShakerLabwareLatchStatus.IDLE_CLOSED
            )

    async def prep_for_update(self) -> str:
        return "no"

    async def clear_error(self) -> None:
        self._error_status = None


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
        """Poll the heater/shaker."""

        return PollResult(
            temperature=await self._driver.get_temperature(),
            rpm=await self._driver.get_rpm(),
            labware_latch=await self._driver.get_labware_latch_status(),
        )


class HeaterShakerListener(WaitableListener[PollResult]):
    """Tempdeck state listener."""

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
        super().on_error(exc)
