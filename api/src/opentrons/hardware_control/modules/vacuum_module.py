from __future__ import annotations

import asyncio
import logging
from typing import (
    Any,
    Awaitable,
    Callable,
    Mapping,
    Optional,
)

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.vacuum_module.abstract import AbstractVacuumModuleDriver
from opentrons.drivers.vacuum_module.driver import (
    VacuumModuleDriver,
)
from opentrons.drivers.vacuum_module.simulator import SimulatingDriver
from opentrons.drivers.vacuum_module.types import (
    LEDColor,
    LEDPattern,
)
from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.modules import mod_abc, update
from opentrons.hardware_control.modules.types import (
    LiveData,
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    ModuleType,
    UploadFunction,
    VacuumModuleData,
    VacuumModuleStatus,
)
from opentrons.hardware_control.poller import Poller, Reader
from opentrons.hardware_control.types import StatusBarState, StatusBarUpdateEvent

log = logging.getLogger(__name__)

POLL_PERIOD = 2.0
SIMULATING_POLL_PERIOD = POLL_PERIOD / 20.0

DFU_PID = "df11"


class VacuumModule(mod_abc.AbstractModule):
    """Hardware control interface for an attached Flex-Stacker module."""

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
            device_info=(await driver.get_device_info()).to_dict(),
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

    async def _initialized_callback(self) -> None:
        """Called by the reader once the module is initialized."""
        if self._last_status_bar_event:
            await self._handle_status_bar_event(self._last_status_bar_event)

    def _async_error_callback(self, exception: Exception) -> None:
        self.error_callback(exception)

    async def cleanup(self) -> None:
        """Stop the poller task"""
        await self._poller.stop()
        await self._driver.disconnect()

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
        return self._device_status

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    @property
    def live_data(self) -> LiveData:
        data: VacuumModuleData = {
            "errorDetails": self._reader.error,
        }
        return {"status": self.status.value, "data": data}

    @property
    def should_identify(self) -> bool:
        return self._should_identify

    async def prep_for_update(self) -> str:
        await self._poller.stop()
        await self._driver.set_vacuum_state(False)
        await self._driver.enter_programming_mode()
        # This device has three unique "devices" over DFU
        dfu_info = await update.find_dfu_device(pid=DFU_PID, expected_device_count=3)
        return dfu_info

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


class VacuumModuleReader(Reader):
    error: Optional[str]

    def __init__(self, driver: AbstractVacuumModuleDriver) -> None:
        self.error: Optional[str] = None
        self._driver = driver
        self.initialized = False
        self._refresh_state = False
        self._initialized_callback: Optional[Callable[[], Awaitable[None]]] = None
        self._error_callback: Optional[Callable[[Exception], None]] = None

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

    async def read(self) -> None:
        if not self.initialized or self._refresh_state:
            initialized = True
            self._refresh_state = False
            # We are done initializing, sync the led state
            if not self.initialized and initialized:
                self.initialized = True
                if self._initialized_callback:
                    await self._initialized_callback()

        self._set_error(None)

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
