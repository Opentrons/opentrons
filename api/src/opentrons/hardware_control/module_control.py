from __future__ import annotations

import asyncio
import contextlib
import logging
import re
from glob import glob
from typing import TYPE_CHECKING, AsyncGenerator, Callable, List, Optional, Union

from opentrons_shared_data.errors.exceptions import EnumeratedError

from . import modules, peripherals
from .abstract_device import AbstractDevice
from .device import (
    DEVICE_TYPE_BY_NAME,
    DeviceType,
    build_attached_device,
)
from .types import (
    AionotifyEvent,
    AsynchronousModuleErrorNotification,
    BoardRevision,
    HardwareEvent,
    ModuleConnectedNotification,
    ModuleDisconnectedNotification,
    OT3Mount,
    StatusBarUpdateEvent,
)
from opentrons.config import IS_LINUX, IS_ROBOT
from opentrons.drivers.rpi_drivers import interfaces, types, usb, usb_simulator
from opentrons.hardware_control.emulation.module_server.helpers import (
    listen_module_connection,
)
from opentrons.hardware_control.modules import SimulatingModuleAtPort
from opentrons.hardware_control.modules.absorbance_reader import AbsorbanceReader
from opentrons.hardware_control.modules.module_calibration import (
    ModuleCalibrationOffset,
    load_module_calibration_offset,
    save_module_calibration_offset,
)
from opentrons.hardware_control.modules.types import ModuleAtPort, ModuleType
from opentrons.types import Point

if TYPE_CHECKING:
    from .api import API
    from .ot3api import OT3API

CLEANUP_DELAY_S = 3.0

log = logging.getLogger(__name__)

MODULE_PORT_REGEX = re.compile(
    # add a negative lookbehind to suppress matches on OT-2 tempfiles udev creates
    r"(?<!\.#ot_module_)"
    # capture all modules by name using alternation
    + "("
    + "|".join(modules.MODULE_TYPE_BY_NAME.keys())
    + ")"
    # add a negative lookahead to suppress matches on Flex tempfiles udev creates
    + r"\d+(?!\.tmp-c\d+:\d+)",
    re.I,
)
PERIPHERAL_PORT_REGEX = re.compile(
    # add a negative lookbehind to suppress matches on OT-2 tempfiles udev creates
    r"(?<!\.#ot_module_)"
    # capture all modules by name using alternation
    + "("
    + "|".join(peripherals.PERIPHERAL_TYPE_BY_NAME.keys())
    + ")"
    # add a negative lookahead to suppress matches on Flex tempfiles udev creates
    + r"\d+(?!\.tmp-c\d+:\d+)",
    re.I,
)

PERIPHERALS = ["barcodescanner"]


class AttachedModulesControl:
    """
    A class to handle monitoring module attachment, capturing the physical
    USB port information and finally building a module object.
    """

    def __init__(
        self,
        api: Union["API", "OT3API"],
        usb: interfaces.USBDriverInterface,
        event_callback: Callable[[HardwareEvent], None],
    ) -> None:
        self._available_modules: List[modules.AbstractModule] = []
        self._available_peripherals: List[peripherals.AbstractPeripheral] = []
        self._recently_removed_modules: List[modules.AbstractModule] = []
        self._api = api
        self._usb = usb
        self._event_callback = event_callback
        self._reconnect_lock: Optional["asyncio.Lock"] = None
        if not IS_ROBOT and not api.is_simulator:
            # Start task that registers emulated modules.
            self._emulation_listen_task: asyncio.Task[None] | None = (
                api.loop.create_task(listen_module_connection(self.register_devices))
            )
        else:
            self._emulation_listen_task = None

    def subscribe_to_api_event(self, device: AbstractDevice) -> None:
        self._api.add_status_bar_listener(device.event_listener)

    @classmethod
    async def build(
        cls,
        api_instance: Union["API", "OT3API"],
        board_revision: BoardRevision,
        event_callback: Callable[[HardwareEvent], None],
    ) -> AttachedModulesControl:
        usb_instance = (
            usb.USBBus(board_revision)
            if not api_instance.is_simulator and IS_ROBOT
            else usb_simulator.USBBusSimulator()
        )
        mc_instance = cls(
            api=api_instance, usb=usb_instance, event_callback=event_callback
        )

        if not api_instance.is_simulator:
            # Do an initial scan of devices.
            await mc_instance.register_devices(mc_instance.scan())

        return mc_instance

    @property
    def available_modules(self) -> List[modules.AbstractModule]:
        # return both available and recently removed, in case we attempt to grab the device at the same
        # time it experiences an EMI disconnect
        return self._available_modules + self._recently_removed_modules

    @property
    def available_peripherals(self) -> List[peripherals.AbstractPeripheral]:
        return self._available_peripherals

    def _dedupe_available_modules(self, new_mod: modules.AbstractModule) -> None:
        """
        Remove any existing entry in _available_modules that shares new_mod's
        serial, then append new_mod and re-sort.
        """
        if not self._api.is_simulator:
            serial = new_mod.serial_number
            if serial is not None:
                self._available_modules = [
                    m for m in self._available_modules if m.serial_number != serial
                ]
        self._available_modules.append(new_mod)
        self._available_modules = sorted(
            self._available_modules, key=modules.AbstractModule.sort_key
        )

    async def clean_up(self) -> None:
        """Clean up all registered modules and emulator scanning tasks (if any)."""
        for module in self._available_modules:
            await module.cleanup()
        if self._emulation_listen_task is not None:
            self._emulation_listen_task.cancel("cleanup")
            try:
                await self._emulation_listen_task
            except asyncio.CancelledError:
                pass
            except Exception:
                log.exception("Exception cleaning up emulation listen task")
            finally:
                self._emulation_listen_task = None

    async def register_simulated_device(
        self,
        simulated_usb_port: types.USBPort,
        type: DeviceType,
        sim_model: str,
        sim_serial: Optional[str] = None,
    ) -> AbstractDevice:
        device = await self.build_device(
            "", simulated_usb_port, type, sim_model, sim_serial_number=sim_serial
        )
        if isinstance(type, modules.ModuleType):
            assert isinstance(device, modules.AbstractModule)
            self._dedupe_available_modules(device)
        else:
            assert isinstance(device, peripherals.AbstractPeripheral)
            self._available_peripherals.append(device)
            self._available_peripherals = sorted(
                self._available_peripherals, key=peripherals.AbstractPeripheral.sort_key
            )
        return device

    async def build_device(
        self,
        port: str,
        usb_port: types.USBPort,
        type: DeviceType,
        sim_model: Optional[str] = None,
        sim_serial_number: Optional[str] = None,
    ) -> AbstractDevice:
        device = await build_attached_device(
            port=port,
            usb_port=usb_port,
            type=type,
            simulating=self._api.is_simulator or sim_model is not None,
            hw_control_loop=self._api.loop,
            execution_manager=self._api._execution_manager,
            sim_model=sim_model,
            sim_serial_number=sim_serial_number,
            disconnected_callback=self._disconnected_callback,
            error_callback=self._async_error_callback,
        )
        last_event = StatusBarUpdateEvent(
            self._api.get_status_bar_state(), self._api.get_status_bar_enabled()
        )
        device.event_listener(last_event)
        self.subscribe_to_api_event(device)
        return device

    def _disconnected_callback(
        self, model: str, port: str, serial: Optional[str]
    ) -> None:
        """Used by the module to indicate that it was disconnected and should be deleted."""
        mod = ModuleAtPort(port=port, serial=serial, name="")
        asyncio.run_coroutine_threadsafe(
            self.unregister_devices([mod]),
            self._api.loop,
        )
        try:
            self._api.loop.call_soon(
                self._event_callback,
                ModuleDisconnectedNotification(
                    module_serial=serial,
                    module_model=modules.module_model_from_string(model),
                    port=port,
                ),
            )
        except Exception:
            log.exception(
                f"Module disconnect callback for module {model} {serial} at {port} failed"
            )

    def _async_error_callback(
        self,
        exc: Exception,
        model: str,
        port: str,
        serial: str | None,
    ) -> None:
        """Used by the module to indicate it saw an error from its data poller."""
        try:
            self._api.loop.call_soon(
                self._event_callback,
                AsynchronousModuleErrorNotification(
                    exception=EnumeratedError.ensure(exc),
                    module_serial=serial,
                    module_model=modules.module_model_from_string(model),
                    port=port,
                ),
            )
        except Exception:
            log.exception(
                f"Async error callback for module {model} {serial} at {port} for exc {exc} failed"
            )

    @contextlib.asynccontextmanager
    async def _use_reconnect_lock(self) -> AsyncGenerator[None, None]:
        self._reconnect_lock = self._reconnect_lock or asyncio.Lock()

        async with self._reconnect_lock:
            yield

    async def _clear_old_modules(self) -> None:
        async with self._use_reconnect_lock():
            for old_mod in list(self._recently_removed_modules):
                # Important: this wants to be after the remove because this may trigger
                # recursion back to here; we therefore want the module to already be
                # removed so that the recursion terminates next loop
                old_mod.disconnected_callback()
                log.info(f"did not find {old_mod.serial_number}")
                if old_mod in self._recently_removed_modules:
                    self._recently_removed_modules.remove(old_mod)
                await old_mod.cleanup()

    async def _reconnect_single_module(self, old_mod: modules.AbstractModule) -> None:
        """Find an attached module matching old_mod's serial and swap it in."""
        for attached_mod in list(self._available_modules):
            if attached_mod.serial_number != old_mod.serial_number:
                continue
            log.info(f"Found {old_mod.serial_number} was reconnected")
            if attached_mod.port != old_mod.port:
                log.info(f"module moved from {old_mod.port} to {attached_mod.port}")
                await old_mod.move_port(attached_mod.port, attached_mod.usb_port)
            await attached_mod.soft_cleanup()
            await old_mod.soft_cleanup()
            await old_mod.attempt_reconnect()
            if old_mod in self._recently_removed_modules:
                self._recently_removed_modules.remove(old_mod)
            self._dedupe_available_modules(old_mod)
            break

    async def _reconnect_patch(self) -> None:
        try:
            for old_mod in list(self._recently_removed_modules):
                log.info(f"Attempting to find and reconect {old_mod.serial_number}")
                await self._reconnect_single_module(old_mod)
        except BaseException:
            log.exception("Encountered an error during reconnect attempt.")

    async def unregister_devices(  # noqa: C901
        self,
        devices_at_ports: Union[
            List[modules.ModuleAtPort], List[modules.SimulatingModuleAtPort]
        ],
    ) -> None:
        """
        De-register Devices.

        Remove any modules that are no longer found by aionotify.
        """
        removed_devices = []
        start_cleanup_task = False
        for dev in devices_at_ports:
            for attached_dev in self._available_modules + self.available_peripherals:
                if (
                    attached_dev.serial_number == dev.serial
                    or attached_dev.port == dev.port
                ):
                    removed_devices.append(attached_dev)
        for removed_dev in removed_devices:
            try:
                if removed_dev in self._available_modules and isinstance(
                    removed_dev, modules.AbstractModule
                ):
                    self._recently_removed_modules.append(removed_dev)
                    self._available_modules.remove(removed_dev)
                    start_cleanup_task = True
                if removed_dev in self._available_peripherals and isinstance(
                    removed_dev, peripherals.AbstractPeripheral
                ):
                    self._available_peripherals.remove(removed_dev)
                    # Important: this wants to be after the remove because this may trigger
                    # recursion back to here; we therefore want the module to already be
                    # removed so that the recursion terminates next loop
                    removed_dev.disconnected_callback()
                    log.info(
                        f"Device {removed_dev.name()} detached from port {removed_dev.port}"
                    )
                    await removed_dev.cleanup()

            except ValueError:
                log.warning(
                    f"Removed Device {removed_dev} not found in attached device"
                )
        self._available_modules = sorted(
            self._available_modules, key=modules.AbstractModule.sort_key
        )
        self._available_peripherals = sorted(
            self._available_peripherals, key=peripherals.AbstractPeripheral.sort_key
        )
        if start_cleanup_task:
            delay = 0.1 if self._api.is_simulator else CLEANUP_DELAY_S
            self._api.loop.call_later(
                delay, lambda: asyncio.create_task(self._clear_old_modules())
            )

    async def register_devices(
        self,
        new_devices_at_ports: Optional[
            Union[List[modules.ModuleAtPort], List[modules.SimulatingModuleAtPort]]
        ] = None,
        removed_devices_at_ports: Optional[List[modules.ModuleAtPort]] = None,
    ) -> None:
        if new_devices_at_ports is None:
            new_devices_at_ports = []
        if removed_devices_at_ports is None:
            removed_devices_at_ports = []
        # destroy removed mods
        await self.unregister_devices(removed_devices_at_ports)
        unsorted_device_at_port = self._usb.match_virtual_ports(new_devices_at_ports)
        for device in unsorted_device_at_port:
            try:
                new_instance = await self.build_device(
                    port=device.port,
                    usb_port=device.usb_port,
                    type=DEVICE_TYPE_BY_NAME[device.name],
                    sim_serial_number=(
                        device.serial_number
                        if isinstance(device, SimulatingModuleAtPort)
                        else None
                    ),
                    sim_model=(
                        device.model
                        if isinstance(device, SimulatingModuleAtPort)
                        else None
                    ),
                )
                if isinstance(new_instance, peripherals.AbstractPeripheral):
                    self._available_peripherals.append(new_instance)
                    log.info(
                        f"Peripheral {device.name} discovered and attached"
                        f" at port {device.port}, new_instance: {new_instance}"
                    )
                else:
                    assert isinstance(new_instance, modules.AbstractModule)
                    self._dedupe_available_modules(new_instance)
                    log.info(
                        f"Module {device.name} discovered and attached"
                        f" at port {device.port}, new_instance: {new_instance}"
                    )
                    try:
                        self._api.loop.call_soon(
                            self._event_callback,
                            ModuleConnectedNotification(
                                module_serial=device.serial,
                                name=device.name,
                                port=device.port,
                            ),
                        )
                    except Exception:
                        log.exception(
                            f"Module connection callback for module {device.name} {device.serial} at {device.port} failed"
                        )
            except Exception as e:
                log.exception(
                    f"Failed to build device {device.name} at port {device.port}: {e}"
                )
        if len(new_devices_at_ports) > 0:
            async with self._use_reconnect_lock():
                await self._reconnect_patch()
        self._available_peripherals = sorted(
            self._available_peripherals, key=peripherals.AbstractPeripheral.sort_key
        )
        self._available_modules = sorted(
            self._available_modules, key=modules.AbstractModule.sort_key
        )

    def scan(self) -> List[modules.ModuleAtPort]:
        """Scan for connected modules and return list of
        tuples of serial ports and device names
        """
        if IS_ROBOT and IS_LINUX:
            devices = glob("/dev/ot_module*")
        else:
            devices = []

        discovered_modules = []

        for port in devices:
            symlink_port = port.split("dev/")[1]
            peripheral_at_port = self.get_peripheral_at_port(symlink_port)
            module_at_port = self.get_module_at_port(symlink_port)
            if module_at_port:
                discovered_modules.append(module_at_port)
            if peripheral_at_port:
                discovered_modules.append(peripheral_at_port)

        log.debug("Discovered devices: {}".format(discovered_modules))
        return discovered_modules

    @staticmethod
    def get_module_at_port(port: str) -> Optional[modules.ModuleAtPort]:
        """Given a port, returns either a ModuleAtPort
        if it is a recognized module, or None if not recognized.
        """
        match = MODULE_PORT_REGEX.search(port)
        if match:
            name = match.group(1).lower()
            if name not in modules.MODULE_TYPE_BY_NAME:
                log.warning(f"Unexpected module connected: {name} on {port}")
                return None
            return modules.ModuleAtPort(port=f"/dev/{port}", name=name)
        return None

    @staticmethod
    def get_peripheral_at_port(port: str) -> Optional[modules.ModuleAtPort]:
        """Given a port, returns either a ModuleAtPort
        if it is a recognized peripheral, or None if not recognized.
        """
        match = PERIPHERAL_PORT_REGEX.search(port)
        if match:
            name = match.group(1).lower()
            if name not in peripherals.PERIPHERAL_TYPE_BY_NAME:
                log.warning(f"Unexpected peripheral connected: {name} on {port}")
                return None
            return modules.ModuleAtPort(port=f"/dev/{port}", name=name)
        return None

    async def handle_device_appearance(self, event: AionotifyEvent) -> None:
        """Only called upon availability of aionotify. Check that
        the file system has changed and either remove or add devices
        depending on the result.

        Args:
            event: The event passed from aionotify.

        Returns:
            None
        """
        maybe_module_at_port = self.get_module_at_port(event.name)
        maybe_peripheral_at_port = self.get_peripheral_at_port(event.name)
        maybe_device_at_port = maybe_module_at_port or maybe_peripheral_at_port or None
        new_devices = None
        removed_devices = None
        if maybe_device_at_port is not None:
            if hasattr(event.flags, "DELETE") or hasattr(event.flags, "MOVED_FROM"):
                # NOTE: The absorbance reader is a hidraw device, when we first
                # plug it into the Flex, udev rules create a
                # /dev/ot_module_absorbancereader(n) symlink which aionotify
                # detects as a CREATE event and registers an absorbance module.
                # When we create this Absorbance module and connect to it,
                # the Byonoy library opens the device via hidapi which removes
                # the symlink and triggers a DELETE action from aionoify.
                # When the device is deleted, we disconnect from it causing
                # the /dev/ot_module_absorbance(n) symlink to get created, repeating
                # the cycle.

                # This DELETE action would normally delete the device, but in this case
                # Lets ignore these events for the absorbance reader and handle
                # cleanup when the poller attempts to read data and fails.
                if maybe_device_at_port.name == "absorbancereader":
                    return
                removed_devices = [maybe_device_at_port]
                log.info(f"Device Removed: {maybe_device_at_port}")
            elif hasattr(event.flags, "CREATE") or hasattr(event.flags, "MOVED_TO"):
                # NOTE: Absorbance reader gets disonnected when updating, so
                # if the device is updating, dont create a new instance.
                for module in self._available_modules:
                    if (
                        maybe_device_at_port.name == "absorbancereader"
                        and isinstance(module, AbsorbanceReader)
                        and module.updating
                    ):
                        return

                new_devices = [maybe_device_at_port]
                log.info(f"Device Added: {maybe_device_at_port}")
            try:
                await self.register_devices(
                    removed_devices_at_ports=removed_devices,
                    new_devices_at_ports=new_devices,
                )
            except Exception:
                log.exception("Exception in Device registration")

    def get_module_by_module_id(
        self, module_id: str
    ) -> Optional[modules.AbstractModule]:
        """Returns the module with the matching serial id."""
        found_module: Optional[modules.AbstractModule] = None
        for module in self.available_modules:
            if module.device_info["serial"] == module_id:
                found_module = module
                break
        return found_module

    def load_module_offset(
        self, module_type: ModuleType, module_id: str
    ) -> Optional[ModuleCalibrationOffset]:
        log.info(f"Loading module offset for {module_type} {module_id}")
        return load_module_calibration_offset(module_type, module_id)

    def save_module_offset(
        self,
        module: ModuleType,
        module_id: str,
        mount: OT3Mount,
        slot: str,
        offset: Point,
        instrument_id: Optional[str] = None,
    ) -> Optional[ModuleCalibrationOffset]:
        log.info(f"Saving module {module} {module_id} offset: {offset} for slot {slot}")
        save_module_calibration_offset(
            offset, mount, slot, module, module_id, instrument_id
        )
        return load_module_calibration_offset(module, module_id)
