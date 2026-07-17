from __future__ import annotations

import asyncio
import logging
import math
from typing import Any, Awaitable, Callable, List, Mapping, Optional, Union

from typing_extensions import cast

from opentrons.config import IS_ROBOT
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.vacuum_module.abstract import AbstractVacuumModuleDriver
from opentrons.drivers.vacuum_module.driver import (
    VacuumModuleDriver,
)
from opentrons.drivers.vacuum_module.simulator import SimulatingDriver
from opentrons.drivers.vacuum_module.types import (
    LEDColor,
    LEDPattern,
    PumpState,
    VacuumState,
    VentState,
)
from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.modules import mod_abc, update
from opentrons.hardware_control.modules.types import (
    LiveData,
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    ModuleType,
    UploadFunction,
    VacuumModuleCycle,
    VacuumModuleData,
    VacuumModulePowerStep,
    VacuumModulePressureStep,
    VacuumModuleStatus,
    VacuumModuleStep,
    VacuumOperationMode,
)
from opentrons.hardware_control.poller import Poller, Reader
from opentrons.hardware_control.types import StatusBarState, StatusBarUpdateEvent
from opentrons.util.pyro.pyro_synchronous_adapter import (
    convert_result_to_proxy,
    pyro_behavior,
    remove_pyro_synchronous_object,
)

log = logging.getLogger(__name__)

POLL_PERIOD = 2.0
SIMULATING_POLL_PERIOD = POLL_PERIOD / 20.0

DFU_PID = "df11"


# Comparison window
TARGET_REACHED_POLL_PERIOD = 0.5
PRESSURE_COMPARISON_WINDOW_SIZE = 5
POWER_COMPARISON_WINDOW_SIZE = 5
PRESSURE_TOL = 5.0
POWER_TOL = 1.0


class VacuumModule(mod_abc.AbstractModule):
    """Hardware control interface for an attached Vacuum module."""

    MODULE_TYPE = ModuleType.VACUUM_MODULE

    @classmethod
    async def build(
        cls,
        port: str,
        usb_port: USBPort,
        hw_control_loop: asyncio.AbstractEventLoop,
        execution_manager: ExecutionManager,
        disconnected_callback: ModuleDisconnectedCallback,
        error_callback: ModuleErrorCallback,
        poll_interval_seconds: float | None = None,
        simulating: bool = False,
        sim_model: Optional[str] = None,
        sim_serial_number: Optional[str] = None,
    ) -> "VacuumModule":
        """
        Build a VacuumModule

        Args:
            port: The port to connect to
            usb_port: USB Port
            execution_manager: Execution manager.
            hw_control_loop: The event loop running in the hardware control thread.
            poll_interval_seconds: Poll interval override.
            simulating: whether to build a simulating driver
            loop: Loop
            sim_model: The model name used by simulator
            disconnected_callback: Callback to inform the module controller that the device was disconnected

        Returns:
            VacuumModule instance
        """
        driver: AbstractVacuumModuleDriver
        if not simulating:
            driver = await VacuumModuleDriver.create(port=port, loop=hw_control_loop)
            poll_interval_seconds = poll_interval_seconds or POLL_PERIOD
        else:
            driver = SimulatingDriver(serial_number=sim_serial_number)
            poll_interval_seconds = poll_interval_seconds or SIMULATING_POLL_PERIOD

        reader = VacuumModuleReader(driver=driver)
        poller = Poller(reader=reader, interval=poll_interval_seconds)
        module = cls(
            port=port,
            usb_port=usb_port,
            driver=driver,
            reader=reader,
            poller=poller,
            device_info=(await driver.get_device_info()),
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
            error_callback=error_callback,
        )

        try:
            await poller.start()
        except Exception:
            log.exception(f"First read of Flex-Stacker on port {port} failed")

        return module

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        driver: AbstractVacuumModuleDriver,
        reader: VacuumModuleReader,
        poller: Poller,
        device_info: Mapping[str, str],
        hw_control_loop: asyncio.AbstractEventLoop,
        execution_manager: ExecutionManager,
        disconnected_callback: ModuleDisconnectedCallback,
        error_callback: ModuleErrorCallback,
    ):
        super().__init__(
            port=port,
            usb_port=usb_port,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
            error_callback=error_callback,
        )
        self._device_info = device_info
        self._driver = driver
        self._reader = reader
        self._poller = poller
        self._last_status_bar_event: Optional[StatusBarUpdateEvent] = None
        self._should_identify = False
        self._device_status = VacuumModuleStatus.IDLE
        # Set initialized callback
        self._unsubscribe_init = reader.set_initialized_callback(
            self._initialized_callback
        )
        self._unsubscribe_error = reader.set_error_callback(self._async_error_callback)
        self._total_cycle_count: Optional[int] = None
        self._current_cycle_index: Optional[int] = None
        self._total_step_count: Optional[int] = None
        self._current_step_index: Optional[int] = None
        self._error: Optional[str] = None

    async def _initialized_callback(self) -> None:
        """Called by the reader once the module is initialized."""
        if self._last_status_bar_event:
            await self._handle_status_bar_event(self._last_status_bar_event)

    def _async_error_callback(self, exception: Exception) -> None:
        self.error_callback(exception)

    async def soft_cleanup(self) -> None:
        """Stop the poller and disconnect the serial driver without notifying pyro."""
        self._unsubscribe_init()
        self._unsubscribe_error()
        await self._poller.stop()
        await self._driver.disconnect()

    @pyro_behavior(specialty_func=remove_pyro_synchronous_object, apply_local=True)
    async def cleanup(self) -> None:
        """Stop the poller task."""
        await self.soft_cleanup()

    async def move_port(self, port: str, usb_port: USBPort) -> None:
        """Update the module's virtual and physical port after a USB renumber."""
        self._port = port
        self._usb_port = usb_port
        await self._driver.move_port(port)

    async def attempt_reconnect(self) -> None:
        """Reopen the serial connection and restart the poller after a brief disconnect."""
        if not IS_ROBOT:
            return
        log.info("attempting vacuum module reconnect.")
        try:
            if not await self._driver.is_connected():
                self._driver = await VacuumModuleDriver.create(
                    port=self.port, loop=self.loop
                )
                self._reader._driver = self._driver
            self._unsubscribe_init = self._reader.set_initialized_callback(
                self._initialized_callback
            )
            self._unsubscribe_error = self._reader.set_error_callback(
                self._async_error_callback
            )
            await self._poller.stop()
            await self._poller.start()
        except BaseException:
            log.exception("Got an error when trying to reconnect vacuum module.")

    @classmethod
    def name(cls) -> str:
        """Used for picking up serial port symlinks"""
        return "vacuummodule"

    def firmware_prefix(self) -> str:
        """The prefix used for looking up firmware"""
        return "vacuum-module"

    @staticmethod
    def _model_from_revision(revision: Optional[str]) -> str:
        """Defines the revision -> model mapping"""
        return "vacuumModuleV1"

    def model(self) -> str:
        return self._model_from_revision(self._device_info.get("model"))

    @property
    def initialized(self) -> bool:
        """The stacker is ready..."""
        return self._reader.initialized

    @property
    def device_info(self) -> Mapping[str, str]:
        return self._device_info

    @property
    def status(self) -> VacuumModuleStatus:
        """Module status or error state details."""
        return (
            VacuumModuleStatus.RUNNING if self.pump_running else VacuumModuleStatus.IDLE
        )

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    @property
    def live_data(self) -> LiveData:
        data: VacuumModuleData = {
            "errorDetails": self._reader.error,
            "pumpEngaged": self._reader.pump_state.pump_running,
            "currentPressure": self.current_gauge_pressure_mbar,
            "targetPressure": self._reader.vacuum_state.target_gauge_pressure,
            "currentPower": self._reader.pump_state.current_pwm,
            "targetPower": self._reader.get_target_power(),
            "ventStatus": self._reader.vacuum_state.vent_state.formatted,
            "modeType": self._reader.operation_mode,
        }
        return {"status": self.status.value, "data": data}

    @property
    def should_identify(self) -> bool:
        return self._should_identify

    @property
    def vacuum_state(self) -> VacuumState:
        return self._reader.vacuum_state

    @property
    def pump_state(self) -> PumpState:
        return self._reader.pump_state

    @property
    def operation_mode(self) -> VacuumOperationMode:
        return self._reader.operation_mode

    @property
    def pump_running(self) -> bool:
        return (
            self._reader.pump_state.pump_running
            or self._reader.vacuum_state.vacuum_enabled
        )

    def _average_absolute_pressure_mbar(self) -> float:
        state = self.vacuum_state
        return round((state.pressure_abs_a + state.pressure_abs_b) / 2, 2)

    @property
    def current_gauge_pressure_mbar(self) -> float:
        """Gauge pressure derived from absolute and atmospheric sensor readings."""
        state = self.vacuum_state
        return round(self._average_absolute_pressure_mbar() - state.pressure_atm, 2)

    @property
    def under_vacuum(self) -> bool:
        state = self.vacuum_state
        atm_pressure = state.pressure_atm
        avg_pressure = (state.pressure_abs_a + state.pressure_abs_b) / 2
        return math.isclose(
            state.pressure_abs_a, state.pressure_abs_b, abs_tol=PRESSURE_TOL
        ) and not math.isclose(avg_pressure, atm_pressure, abs_tol=PRESSURE_TOL)

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

    def _clear_cycle_counters(self) -> None:
        """Clear the cycle counters."""
        self._total_cycle_count = None
        self._current_cycle_index = None
        self._total_step_count = None
        self._current_step_index = None

    async def prep_for_update(self) -> str:
        await self._poller.stop()
        await self._driver.set_vacuum_state(False)
        await self._driver.enter_programming_mode()
        # This device has three unique "devices" over DFU
        dfu_info = await update.find_dfu_device(pid=DFU_PID, expected_device_count=3)
        return dfu_info

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def bootloader(self) -> UploadFunction:
        return update.upload_via_dfu

    async def deactivate(self, must_be_running: bool = True) -> None:
        pass

    async def set_led_state(
        self,
        power: float,
        color: Optional[LEDColor] = None,
        pattern: Optional[LEDPattern] = None,
        duration: Optional[int] = None,
        reps: Optional[int] = None,
    ) -> None:
        """Sets the statusbar state."""
        return await self._driver.set_led(
            power, color=color, pattern=pattern, duration=duration, reps=reps
        )

    def event_listener(self, event: Any) -> None:
        if isinstance(event, StatusBarUpdateEvent):
            self._last_status_bar_event = event
            asyncio.run_coroutine_threadsafe(
                self._handle_status_bar_event(event), self._loop
            )

    async def _handle_status_bar_event(self, event: StatusBarUpdateEvent) -> None:  # noqa: C901
        if event.enabled and self.initialized:
            match event.state:
                case StatusBarState.RUNNING:
                    await self.set_led_state(0.5, LEDColor.GREEN, LEDPattern.STATIC)
                case StatusBarState.PAUSED:
                    if self.should_identify:
                        await self._statusbar_pause()
                    else:
                        await self._statusbar_idle()
                case StatusBarState.HARDWARE_ERROR:
                    if self.should_identify:
                        await self.set_led_state(
                            0.5, LEDColor.RED, LEDPattern.FLASH, duration=300
                        )
                    else:
                        await self._statusbar_idle()
                case StatusBarState.SOFTWARE_ERROR:
                    await self.set_led_state(0.5, LEDColor.YELLOW, LEDPattern.STATIC)
                case StatusBarState.ERROR_RECOVERY:
                    if self.should_identify:
                        await self.set_led_state(
                            0.5, LEDColor.YELLOW, LEDPattern.PULSE, duration=2000
                        )
                    else:
                        await self._statusbar_idle()
                case StatusBarState.RUN_COMPLETED:
                    await self.set_led_state(0.5, LEDColor.GREEN, LEDPattern.PULSE)
                case StatusBarState.UPDATING:
                    await self.set_led_state(0.5, LEDColor.WHITE, LEDPattern.PULSE)
                case StatusBarState.IDLE | _:
                    await self._statusbar_idle()

    async def _statusbar_pause(self) -> None:
        await self.set_led_state(0.5, LEDColor.BLUE, LEDPattern.PULSE, duration=2000)

    async def _statusbar_idle(self) -> None:
        await self.set_led_state(0.5, LEDColor.WHITE, LEDPattern.STATIC)

    async def identify(self, start: bool, color_name: Optional[str] = None) -> None:
        """Identify the module."""
        reps = -1 if start else 0
        color = LEDColor.from_name(color_name or LEDColor.BLUE.name)
        await self.set_led_state(0.5, color, LEDPattern.PULSE, reps=reps)
        if not start and self._last_status_bar_event:
            await self._handle_status_bar_event(self._last_status_bar_event)

    def set_statusbar_identify(self, state: bool) -> None:
        self._should_identify = state

    def cleanup_persistent(self) -> None:
        """Reset persistent data on the module that should not exist outside of a run."""
        self.set_statusbar_identify(False)

    async def set_vent_state(self, vent_state: VentState) -> None:
        """Open or close the vent."""
        # TODO: Handle error
        await self._driver.set_vent_state(state=vent_state)

    async def set_vacuum_state(
        self,
        enable_vacuum: bool,
        gauge_pressure_mbar: Optional[float] = None,
        duration_s: Optional[int] = None,
        timeout_s: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Handler for internal pressure controls."""
        self._reader.set_operation_mode(VacuumOperationMode.PRESSURE)
        self._reader.reset_power_target()
        self._reader.set_target_pressure(gauge_pressure_mbar)
        await self._driver.set_vacuum_state(
            enable_vacuum=enable_vacuum,
            gauge_pressure_mbar=gauge_pressure_mbar,
            duration_s=duration_s,
            timeout_s=timeout_s,
            rate=rate,
            vent_after=vent_after,
        )

    async def set_pump_state(
        self,
        start_pump: bool,
        target_rpm: Optional[int] = None,
        duty_cycle: Optional[int] = None,
        duration_s: Optional[int] = None,
        timeout_s: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Control the pump agnostically to the internal pressure"""
        self._reader.set_operation_mode(VacuumOperationMode.POWER)
        self._reader.reset_pressure_target()
        if duty_cycle is not None:
            self._reader.set_target_power(float(duty_cycle))
        elif not start_pump:
            self._reader.reset_power_target()

        await self._driver.set_vacuum_state(enable_vacuum=False)
        await self._driver.set_pump_state(
            start_pump=start_pump,
            target_rpm=target_rpm,
            duty_cycle=duty_cycle,
            duration_s=duration_s,
            timeout_s=timeout_s,
            rate=rate,
            vent_after=vent_after,
        )

    async def _execute_cycle_step(self, step: VacuumModuleStep) -> None:
        enable_pump = step["enable_pump"]
        hold_time_seconds = (
            step["hold_time_seconds"] if step["hold_time_seconds"] else 0
        )
        hold_time_minutes = step["hold_time_minutes"]
        ramp_rate = step["ramp_rate"]
        timeout_seconds = step["timeout_seconds"]
        vent_after = step["vent_after"]
        # this gives users the ability to not specify a duration at all if
        # they want the pump to run indefinitely
        if hold_time_minutes is not None and hold_time_seconds is not None:
            hold_time_seconds += hold_time_minutes * 60
        elif hold_time_minutes is not None and hold_time_seconds is None:
            hold_time_seconds = hold_time_minutes * 60
        if "percent_power" in step:
            percent_power = cast(VacuumModulePowerStep, step)["percent_power"]
            await self.set_pump_state(
                start_pump=enable_pump,
                duty_cycle=percent_power,
                duration_s=hold_time_seconds,
                timeout_s=timeout_seconds,
                rate=ramp_rate,
                vent_after=vent_after,
            )
        if "gauge_pressure_mbar" in step:
            gauge_pressure_mbar = cast(VacuumModulePressureStep, step)[
                "gauge_pressure_mbar"
            ]
            await self.set_vacuum_state(
                enable_vacuum=enable_pump,
                gauge_pressure_mbar=gauge_pressure_mbar,
                duration_s=hold_time_seconds,
                timeout_s=timeout_seconds,
                rate=ramp_rate,
                vent_after=vent_after,
            )

    async def _execute_profile(
        self,
        profile: List[Union[VacuumModuleCycle, VacuumModuleStep]],
        vent_after: bool = False,
    ) -> None:
        self._current_cycle_index = 0
        self._current_step_index = 0
        for step_or_cycle in profile:
            self._current_cycle_index += 1
            if "repetitions" in step_or_cycle:
                this_cycle = cast(VacuumModuleCycle, step_or_cycle)
                # basically https://github.com/python/mypy/issues/14766
                for rep in range(this_cycle["repetitions"]):
                    for step in this_cycle["steps"]:
                        self._current_step_index += 1
                        await self._execute_cycle_step(step)
                        if (
                            step["hold_time_minutes"] is not None
                            or step["hold_time_seconds"] is not None
                        ):
                            await self.wait_for_command_duration()
                        else:
                            await self.wait_for_target()
                if this_cycle["vent_after"] is not None:
                    await self.set_vent_state(
                        vent_state=VentState(this_cycle["vent_after"])
                    )
            else:
                await self._execute_cycle_step(step_or_cycle)
                await self.wait_for_command_duration()
        if vent_after:
            await self.set_vent_state(VentState.OPENED)

    async def execute_profile(
        self,
        profile: List[Union[VacuumModuleCycle, VacuumModuleStep]],
        vent_after: bool = False,
    ) -> None:
        await self.wait_for_is_running()
        self._total_cycle_count = 0
        self._total_step_count = 0
        self._current_cycle_index = 0
        self._current_step_index = 0
        for step_or_cycle in profile:
            if "steps" in step_or_cycle:
                this_cycle = cast(VacuumModuleCycle, step_or_cycle)
                self._total_cycle_count += this_cycle["repetitions"]
                self._total_step_count += (
                    len(this_cycle["steps"]) * this_cycle["repetitions"]
                )
            else:
                self._total_step_count += 1
                self._total_cycle_count += 1
        task = self._loop.create_task(self._execute_profile(profile))
        self.make_cancellable(task)
        await task

    async def _wait_for_command_duration(self) -> None:
        await self._reader.update_vacuum_state()

        while self.vacuum_state.vacuum_duration > 0:
            await self._poller.wait_next_poll()

    async def wait_for_command_duration(self) -> None:
        await self.wait_for_is_running()

        task = self._loop.create_task(self._wait_for_command_duration())
        self.make_cancellable(task)
        await task

    async def wait_for_target(self) -> None:
        await self.wait_for_is_running()
        task = self._loop.create_task(self._wait_for_target())
        self.make_cancellable(task)
        await task

    async def _wait_for_target(self) -> None:
        if self._reader.operation_mode == VacuumOperationMode.POWER:
            while not self._reader.power_target_reached():
                await asyncio.sleep(TARGET_REACHED_POLL_PERIOD)
                await self._reader.update_pump_state()
                if not self._reader.pump_state.pump_running:
                    return
            # clear target after it's reached
            self._reader.reset_power_target()
        elif self._reader.operation_mode == VacuumOperationMode.PRESSURE:
            while not self._reader.pressure_target_reached():
                await asyncio.sleep(TARGET_REACHED_POLL_PERIOD)
                await self._reader.update_vacuum_state()
                if not self._reader.vacuum_state.vacuum_enabled:
                    return
            # clear target after it's reached
            self._reader.reset_pressure_target()
        else:
            raise ValueError("Vacuum module target invalid.")


class VacuumModuleReader(Reader):
    error: Optional[str]

    def __init__(self, driver: AbstractVacuumModuleDriver) -> None:
        self.error: Optional[str] = None
        self.vacuum_state: VacuumState = VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=0,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
        self.pump_state: PumpState = PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=0,
            current_pwm=0,
            pump_running=False,
            manual_control=False,
        )
        self.operation_mode = VacuumOperationMode.PRESSURE
        self._driver = driver
        self.initialized = False
        self._refresh_state = False
        self._initialized_callback: Optional[Callable[[], Awaitable[None]]] = None
        self._error_callback: Optional[Callable[[Exception], None]] = None
        self.target_pressure: Optional[float] = None
        self.target_power: Optional[float] = None
        self._pressure_readings: List[Optional[float]] = [
            None
        ] * PRESSURE_COMPARISON_WINDOW_SIZE
        self._power_readings: List[Optional[float]] = [
            None
        ] * POWER_COMPARISON_WINDOW_SIZE

    def set_initialized_callback(
        self, callback: Callable[[], Awaitable[None]]
    ) -> Callable[[], None]:
        """Sets the callback used when done initializing the module."""
        self._initialized_callback = callback
        return self._remove_init_callback

    def _remove_init_callback(self) -> None:
        self._initialized_callback = None

    def set_error_callback(
        self, error_callback: Callable[[Exception], None]
    ) -> Callable[[], None]:
        """Register a handler for asynchronous hardware errors."""
        self._error_callback = error_callback
        return self._remove_error_callback

    def _remove_error_callback(self) -> None:
        self._error_callback = None

    def set_target_pressure(self, gauge_pressure_mbar: Optional[float]) -> None:
        self.target_pressure = gauge_pressure_mbar

    def set_target_power(self, duty_cycle: Optional[float]) -> None:
        self.target_power = duty_cycle

    def get_target_power(self) -> Optional[float]:
        if self.target_power is not None:
            return self.target_power

        if self.operation_mode == VacuumOperationMode.POWER:
            target_pwm = self.pump_state.target_pwm
            if target_pwm != 0:
                return float(target_pwm)

        return None

    def reset_pressure_target(self) -> None:
        self.set_target_pressure(None)
        self._pressure_readings = [None for p in self._pressure_readings]

    def reset_power_target(self) -> None:
        self.set_target_power(None)
        self._power_readings = [None for p in self._power_readings]

    async def read(self) -> None:
        await self.update_vacuum_state()
        await self.update_pump_state()
        if not self.initialized or self._refresh_state:
            initialized = True
            self._refresh_state = False
            # We are done initializing, sync the led state
            if not self.initialized and initialized:
                self.initialized = True
                if self._initialized_callback:
                    await self._initialized_callback()

        self._set_error(None)

    def power_target_reached(self, tol: float = POWER_TOL) -> bool:
        if self.target_power is None or any([p is None for p in self._power_readings]):
            return False
        return all(
            [
                math.isclose(p, self.target_power, abs_tol=tol)
                for p in self._power_readings
                if p is not None
            ]
        )

    def pressure_target_reached(self, tol: float = PRESSURE_TOL) -> bool:
        if self.target_pressure is None or any(
            [p is None for p in self._pressure_readings]
        ):
            return False
        return all(
            [
                math.isclose(p, self.target_pressure, abs_tol=tol)
                for p in self._pressure_readings
                if p is not None
            ]
        )

    def set_refresh_state(self) -> None:
        """Tell the reader to refresh all states, even ones that arent polled."""
        self._refresh_state = True

    def on_error(self, exception: Exception) -> None:
        self._driver.reset_serial_buffers()
        self._set_error(exception)

    def _set_error(self, exception: Optional[Exception]) -> None:
        if exception is None:
            self.error = None
        else:
            if self._error_callback:
                self._error_callback(exception)
            try:
                self.error = str(exception.args[0])
            except Exception:
                self.error = repr(exception)

    async def update_vacuum_state(self) -> None:
        """Get latest vacuum state from driver and save updated values."""
        self.vacuum_state = await self._driver.get_vacuum_state()

        if self.target_pressure is not None:
            self._pressure_readings.insert(0, self.vacuum_state.current_gauge_pressure)
            self._pressure_readings.pop()

    async def update_pump_state(self) -> None:
        """Get latest pump state from driver and save updated values."""
        self.pump_state = await self._driver.get_pump_state()

        if self.target_power is not None:
            self._power_readings.insert(0, self.pump_state.current_pwm)
            self._power_readings.pop()

    def set_operation_mode(self, mode_type: VacuumOperationMode) -> None:
        self.operation_mode = mode_type
