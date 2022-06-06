import asyncio
import logging
from typing import Optional, List, Dict, Mapping, Callable
from dataclasses import dataclass
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.types import ThermocyclerLidStatus, Temperature, PlateTemperature
from opentrons.hardware_control.modules.lid_temp_status import LidTemperatureStatus
from opentrons.hardware_control.modules.plate_temp_status import PlateTemperatureStatus
from opentrons.hardware_control.modules.types import TemperatureStatus
from opentrons.hardware_control.poller import Reader, WaitableListener, Poller

from ..execution_manager import ExecutionManager
from . import types, update, mod_abc
from opentrons.drivers.thermocycler import (
    AbstractThermocyclerDriver,
    SimulatingDriver,
    ThermocyclerDriverV2,
    ThermocyclerDriverFactory,
)


MODULE_LOG = logging.getLogger(__name__)

POLLING_FREQUENCY_SEC = 1.0
SIM_POLLING_FREQUENCY_SEC = POLLING_FREQUENCY_SEC / 20.0

TEMP_UPDATE_RETRIES = 50


class ThermocyclerError(Exception):
    pass


class Thermocycler(mod_abc.AbstractModule):
    """
    Under development. API subject to change without a version bump
    """

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
    ) -> "Thermocycler":
        """
        Build and connect to a Thermocycler

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
            Thermocycler instance.
        """
        polling_frequency = kwargs.get("polling_frequency")
        driver: AbstractThermocyclerDriver
        if not simulating:
            driver = await ThermocyclerDriverFactory.create(port=port, loop=loop)
            polling_frequency = polling_frequency or POLLING_FREQUENCY_SEC
        else:
            driver = SimulatingDriver(model=sim_model)
            polling_frequency = polling_frequency or SIM_POLLING_FREQUENCY_SEC

        mod = cls(
            port=port,
            usb_port=usb_port,
            driver=driver,
            device_info=await driver.get_device_info(),
            loop=loop,
            execution_manager=execution_manager,
            polling_interval_sec=polling_frequency,
        )
        return mod

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        driver: AbstractThermocyclerDriver,
        device_info: Dict[str, str],
        loop: Optional[asyncio.AbstractEventLoop] = None,
        polling_interval_sec: float = POLLING_FREQUENCY_SEC,
    ) -> None:
        """
        Constructor

        Args:
            port: The port the thermocycler is connected to.
            usb_port: The USB port.
            execution_manager: The hardware execution manager.
            driver: The thermocycler driver.
            device_info: The thermocycler device info.
            loop: Optional loop.
            polling_interval_sec: How often to poll thermocycler for status
        """
        super().__init__(
            port=port, usb_port=usb_port, loop=loop, execution_manager=execution_manager
        )
        self._driver = driver
        self._device_info = device_info
        self._listener = ThermocyclerListener(
            loop=loop, interrupt_callback=self._enter_error_state
        )
        self._poller = Poller(
            interval_seconds=polling_interval_sec,
            listener=self._listener,
            reader=PollerReader(driver=self._driver),
        )
        self._hold_time_fuzzy_seconds = polling_interval_sec * 5

        self._total_cycle_count: Optional[int] = None
        self._current_cycle_index: Optional[int] = None
        self._total_step_count: Optional[int] = None
        self._current_step_index: Optional[int] = None
        self._in_error_state: bool = False

    async def cleanup(self) -> None:
        """Stop the poller task."""
        await self._poller.stop_and_wait()
        await self._driver.disconnect()

    @classmethod
    def name(cls) -> str:
        return "thermocycler"

    def model(self) -> str:
        if isinstance(self._driver, SimulatingDriver):
            return self._driver.model()
        elif isinstance(self._driver, ThermocyclerDriverV2):
            return "thermocyclerModuleV2"
        else:
            # Real module that is not a V2
            return "thermocyclerModuleV1"

    def bootloader(self) -> types.UploadFunction:
        if isinstance(self._driver, ThermocyclerDriverV2):
            return update.upload_via_dfu
        else:
            return update.upload_via_bossa

    def _clear_cycle_counters(self) -> None:
        """Clear the cycle counters."""
        self._total_cycle_count = None
        self._current_cycle_index = None
        self._total_step_count = None
        self._current_step_index = None

    async def deactivate_lid(self) -> None:
        """Deactivate the lid heating pad"""
        await self.wait_for_is_running()
        await self._driver.deactivate_lid()

    async def deactivate_block(self) -> None:
        """Deactivate the block peltiers"""
        await self.wait_for_is_running()
        self._clear_cycle_counters()
        await self._driver.deactivate_block()

    async def deactivate(self) -> None:
        """Deactivate the block peltiers and lid heating pad"""
        await self.wait_for_is_running()
        self._clear_cycle_counters()
        await self._driver.deactivate_all()

    async def open(self) -> str:
        """Open the lid if it is closed"""
        await self.wait_for_is_running()
        await self._driver.open_lid()
        await self._wait_for_lid_status(ThermocyclerLidStatus.OPEN)
        return ThermocyclerLidStatus.OPEN

    async def close(self) -> str:
        """Close the lid if it is open"""
        await self.wait_for_is_running()
        await self._driver.close_lid()
        await self._wait_for_lid_status(ThermocyclerLidStatus.CLOSED)
        return ThermocyclerLidStatus.CLOSED

    def hold_time_probably_set(self, new_hold_time: Optional[float]) -> bool:
        """
        Since we can only get hold time *remaining* from TC, by the time we
        read hold_time after a set_temperature, the hold_time in TC could have
        started counting down. So instead of checking for equality, we will
        have to check if the hold_time returned from TC is within a few seconds
        of the new hold time. The number of seconds is determined by status
        polling frequency.
        """
        if new_hold_time is None:
            return True
        hold_time = self.hold_time
        if hold_time is None:
            return False
        lower_bound = max(0.0, new_hold_time - self._hold_time_fuzzy_seconds)
        return lower_bound <= hold_time <= new_hold_time

    async def set_temperature(
        self,
        temperature: float,
        hold_time_seconds: Optional[float] = None,
        hold_time_minutes: Optional[float] = None,
        ramp_rate: Optional[float] = None,
        volume: Optional[float] = None,
    ) -> None:
        """
        Set the temperature and wait.

        If hold time is set this function will return after
        the hold time expires.

        Otherwise it will return when the target temperature is reached.

        Args:
            temperature: The target temperature.
            hold_time_seconds: Optional number of seconds to wait.
            hold_time_minutes: Optional number of minutes to wait.
            ramp_rate: Optional ramp rate.
            volume: Optional volume.

        Returns: None
        """
        await self.wait_for_is_running()
        seconds = hold_time_seconds if hold_time_seconds is not None else 0
        minutes = hold_time_minutes if hold_time_minutes is not None else 0
        total_seconds = seconds + (minutes * 60)
        hold_time = total_seconds if total_seconds > 0 else 0
        if ramp_rate is not None:
            await self._driver.set_ramp_rate(ramp_rate=ramp_rate)
        await self._driver.set_plate_temperature(
            temp=temperature, hold_time=hold_time, volume=volume
        )

        # Wait for target temperature to be set.
        retries = 0
        while self.target != temperature or not self.hold_time_probably_set(hold_time):
            await self.wait_for_is_running()
            # Wait for the poller to update
            await self.wait_next_poll()
            retries += 1
            if retries > TEMP_UPDATE_RETRIES:
                raise ThermocyclerError(
                    f"Thermocycler driver set the block temp to "
                    f"T={temperature} & H={hold_time} but status reads "
                    f"T={self.target} & H={self.hold_time}"
                )

        if hold_time:
            task = self._loop.create_task(self._wait_for_hold(hold_time))
        else:
            task = self._loop.create_task(self._wait_for_temp())
        self.make_cancellable(task)
        await task

    async def wait_for_block_temperature(
        self,
        temperature: float,
    ) -> None:
        """
        Wait for thermocycler to reach given temperature.

        Will return when the target temperature is reached.

        Args:
            temperature: The target temperature.

        Returns: None
        """
        await self.wait_for_is_running()

        # Wait for target temperature to be set.
        retries = 0
        while self.target != temperature:
            await self.wait_for_is_running()
            # Wait for the poller to update
            await self.wait_next_poll()
            retries += 1
            if retries > TEMP_UPDATE_RETRIES:
                raise ThermocyclerError(
                    f"Thermocycler driver waiting for block temp "
                    f"T={temperature} but status reads "
                    f"T={self.target}"
                )

        task = self._loop.create_task(self._wait_for_temp())
        self.make_cancellable(task)
        await task

    async def cycle_temperatures(
        self,
        steps: List[types.ThermocyclerStep],
        repetitions: int,
        volume: Optional[float] = None,
    ) -> None:
        """
        Begin a set temperature cycle.

        Args:
            steps: The set temperature steps.
            repetitions: Number of repetitions.
            volume: Optional volume.

        Returns: None
        """
        await self.wait_for_is_running()
        self._total_cycle_count = repetitions
        self._total_step_count = len(steps)

        task = self._loop.create_task(self._execute_cycles(steps, repetitions, volume))
        self.make_cancellable(task)
        await task

    async def set_lid_temperature(self, temperature: float) -> None:
        """Set the lid temperature in deg Celsius"""
        await self.wait_for_is_running()
        await self._driver.set_lid_temperature(temp=temperature)
        # Wait for target to be set
        retries = 0
        while self.lid_target != temperature:
            await self.wait_for_is_running()
            # Wait for the poller to update
            await self.wait_next_poll()
            retries += 1
            if retries > TEMP_UPDATE_RETRIES:
                raise ThermocyclerError(
                    f"Thermocycler driver set the lid temp to T={temperature} "
                    f"but status reads T={self.lid_target}"
                )
        task = self._loop.create_task(self._wait_for_lid_temp())
        self.make_cancellable(task)
        await task

    async def wait_for_lid_temperature(self, temperature: float) -> None:
        """Set the lid temperature in deg Celsius"""
        await self.wait_for_is_running()

        # Wait for target to be set
        retries = 0
        while self.lid_target != temperature:
            await self.wait_for_is_running()
            # Wait for the poller to update
            await self.wait_next_poll()
            retries += 1
            if retries > TEMP_UPDATE_RETRIES:
                raise ThermocyclerError(
                    f"Thermocycler driver set the lid temp to T={temperature} "
                    f"but status reads T={self.lid_target}"
                )
        task = self._loop.create_task(self._wait_for_lid_temp())
        self.make_cancellable(task)
        await task

    # TODO(mc, 2022-04-25): de-duplicate with `set_temperature`
    async def set_target_block_temperature(
        self,
        celsius: float,
        hold_time_seconds: Optional[float] = None,
        volume: Optional[float] = None,
    ) -> None:
        """Set the Thermocycler's target block temperature.

        Does not wait for the target temperature to be reached.

        Args:
            celsius: The target block temperature, in degrees celsius.
        """
        await self.wait_for_is_running()
        await self._driver.set_plate_temperature(
            temp=celsius,
            hold_time=hold_time_seconds,
            volume=volume,
        )
        await self.wait_next_poll()

    # TODO(mc, 2022-04-26): de-duplicate with `set_lid_temperature`
    async def set_target_lid_temperature(self, celsius: float) -> None:
        """Set the Thermocycler's target lid temperature.

        Does not wait for the target temperature to be reached.

        Args:
            celsius: The target lid temperature, in degrees celsius.
        """
        await self.wait_for_is_running()
        await self._driver.set_lid_temperature(temp=celsius)
        await self.wait_next_poll()

    async def _wait_for_lid_temp(self) -> None:
        """
        This method only exits if lid target temperature has been reached.

        Subject to change without a version bump.
        """
        if self.is_simulated:
            return

        while self._listener.lid_status != TemperatureStatus.HOLDING:
            await self.wait_next_poll()

    async def _wait_for_temp(self) -> None:
        """
        This method only exits if set temperature has been reached.

        Subject to change without a version bump.
        """
        while self._listener.plate_status != TemperatureStatus.HOLDING:
            await self.wait_next_poll()

    async def _wait_for_hold(self, hold_time: float = 0) -> None:
        """
        This method returns only when hold time has elapsed
        """
        if self.is_simulated:
            return

        # If hold time is within the _hold_time_fuzzy_seconds time gap, then,
        # because of the driver's status poller delays, it is impossible to
        # know for certain if self.hold_time holds the most recent value.
        # So instead of counting on the cached self.hold_time, it is better to
        # just wait for hold_time time. (Skip if hold_time = 0 since we don't
        # want to wait in that case. Cached self.hold_time would be 0 anyway)
        if 0 < hold_time <= self._hold_time_fuzzy_seconds:
            await asyncio.sleep(hold_time)
        else:
            while self.hold_time != 0:
                await self.wait_next_poll()

    async def _wait_for_lid_status(self, status: ThermocyclerLidStatus) -> None:
        """Wait for lid status to be status."""
        while self.lid_status != status:
            await self.wait_next_poll()

    async def wait_next_poll(self) -> None:
        """Wait for the next poll to complete."""
        await self._listener.wait_next_poll()

    @property
    def lid_target(self) -> Optional[float]:
        return (
            self._listener.state.lid_temperature.target
            if self._listener.state
            else None
        )

    @property
    def lid_temp(self) -> Optional[float]:
        return (
            self._listener.state.lid_temperature.current
            if self._listener.state
            else None
        )

    # todo(mm, 2021-11-29): Instead of being Optional, should this return
    # ThermocyclerLidStatus.UNKNOWN when self._listener.state is None?
    @property
    def lid_status(self) -> Optional[ThermocyclerLidStatus]:
        return self._listener.state.lid_status if self._listener.state else None

    @property
    def lid_temp_status(self) -> Optional[str]:
        return self._listener.lid_status

    @property
    def ramp_rate(self) -> Optional[float]:
        """Not supported."""
        return None

    @property
    def hold_time(self) -> Optional[float]:
        return (
            self._listener.state.plate_temperature.hold
            if self._listener.state
            else None
        )

    @property
    def temperature(self) -> Optional[float]:
        return (
            self._listener.state.plate_temperature.current
            if self._listener.state
            else None
        )

    @property
    def target(self) -> Optional[float]:
        return (
            self._listener.state.plate_temperature.target
            if self._listener.state
            else None
        )

    @property
    def status(self) -> str:
        return (
            self._listener.plate_status
            if not self._in_error_state
            else TemperatureStatus.ERROR
        )

    @property
    def device_info(self) -> Mapping[str, str]:
        return self._device_info

    @property
    def total_cycle_count(self) -> Optional[int]:
        return self._total_cycle_count

    @property
    def current_cycle_index(self) -> Optional[int]:
        return self._current_cycle_index

    @property
    def total_step_count(self) -> Optional[int]:
        return self._total_step_count

    @property
    def current_step_index(self) -> Optional[int]:
        return self._current_step_index

    @property
    def live_data(self) -> types.LiveData:
        return {
            "status": self.status,
            "data": {
                "lid": self.lid_status,
                "lidTarget": self.lid_target,
                "lidTemp": self.lid_temp,
                "currentTemp": self.temperature,
                "targetTemp": self.target,
                "holdTime": self.hold_time,
                "rampRate": self.ramp_rate,
                "currentCycleIndex": self.current_cycle_index,
                "totalCycleCount": self.total_cycle_count,
                "currentStepIndex": self.current_step_index,
                "totalStepCount": self.total_step_count,
            },
        }

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    async def prep_for_update(self) -> str:
        await self._driver.enter_programming_mode()

        new_port = await update.find_bootloader_port()

        return new_port or self.port

    async def _execute_cycle_step(
        self, step: types.ThermocyclerStep, volume: Optional[float]
    ) -> None:
        """
        Execute a thermocycler step.

        Args:
            step: The set temperature parameters.
            volume: The volume

        Returns: None
        """
        await self.wait_for_is_running()

        temperature = step.get("temperature")
        hold_time_minutes = step.get("hold_time_minutes", None)
        hold_time_seconds = step.get("hold_time_seconds", None)
        ramp_rate = step.get("ramp_rate", None)
        await self.set_temperature(
            temperature=temperature,  # type: ignore
            hold_time_minutes=hold_time_minutes,
            hold_time_seconds=hold_time_seconds,
            ramp_rate=ramp_rate,
            volume=volume,
        )

    async def _execute_cycles(
        self,
        steps: List[types.ThermocyclerStep],
        repetitions: int,
        volume: Optional[float] = None,
    ) -> None:
        """
        Execute cycles.

        Args:
            steps: The set temperature steps.
            repetitions: The number of repetitions
            volume: The optional volume.

        Returns: None
        """
        for rep in range(repetitions):
            self._current_cycle_index = rep + 1  # science starts at 1
            for step_idx, step in enumerate(steps):
                self._current_step_index = step_idx + 1  # science starts at 1
                await self._execute_cycle_step(step, volume)
                await self._wait_for_hold()

    def _enter_error_state(self, cause: Exception) -> None:
        """Enter into an error state.

        The Thermocycler will not be accessible in this state.

        Args:
            cause: The cause of the exception.

        Returns:
            None
        """
        self._in_error_state = True
        MODULE_LOG.error(
            f"Thermocycler has encountered an unrecoverable error: {str(cause)}. "
            f"Please refer to support article at "
            f"https://support.opentrons.com/en/articles/3469797-thermocycler-module"
            f" for troubleshooting."
        )
        self._poller.stop()
        asyncio.run_coroutine_threadsafe(self._driver.disconnect(), self._loop)


@dataclass
class PolledData:
    lid_status: ThermocyclerLidStatus
    lid_temperature: Temperature
    plate_temperature: PlateTemperature


class PollerReader(Reader[PolledData]):
    """Polled data reader."""

    def __init__(self, driver: AbstractThermocyclerDriver) -> None:
        """Constructor."""
        self._driver = driver

    async def read(self) -> PolledData:
        """Poll the thermocycler."""
        lid_status = await self._driver.get_lid_status()
        lid_temperature = await self._driver.get_lid_temperature()
        plate_temperature = await self._driver.get_plate_temperature()
        return PolledData(
            lid_status=lid_status,
            lid_temperature=lid_temperature,
            plate_temperature=plate_temperature,
        )


class ThermocyclerListener(WaitableListener[PolledData]):
    """Thermocycler state listener."""

    def __init__(
        self,
        interrupt_callback: Callable[[Exception], None],
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        """Constructor."""
        super().__init__(loop=loop)
        self._callback = interrupt_callback
        self._polled_data: Optional[PolledData] = None
        self._plate_temperature_status = PlateTemperatureStatus()
        self._lid_temperature_status = LidTemperatureStatus()

    @property
    def state(self) -> Optional[PolledData]:
        return self._polled_data

    @property
    def plate_status(self) -> TemperatureStatus:
        return self._plate_temperature_status.status

    @property
    def lid_status(self) -> TemperatureStatus:
        return self._lid_temperature_status.status

    def on_poll(self, result: PolledData) -> None:
        """On new poll."""
        self._polled_data = result
        self._plate_temperature_status.update(result.plate_temperature)
        self._lid_temperature_status.update(result.lid_temperature)
        return super().on_poll(result)

    def on_error(self, exc: Exception) -> None:
        """On error."""
        if self._callback:
            self._callback(exc)
        return super().on_error(exc)
