from __future__ import annotations
import logging
import re
from typing import TYPE_CHECKING, List, Optional, Union
from glob import glob

from opentrons.config import IS_ROBOT, IS_LINUX
from opentrons.drivers.rpi_drivers import types, interfaces, usb, usb_simulator
from opentrons.hardware_control.emulation.module_server.helpers import (
    listen_module_connection,
)
from opentrons.hardware_control.modules.module_calibration import (
    ModuleCalibrationOffset,
    load_module_calibration_offset,
    save_module_calibration_offset,
)
from opentrons.hardware_control.modules.types import ModuleType
from opentrons.hardware_control.modules import SimulatingModuleAtPort

from opentrons.types import Point
from .types import AionotifyEvent, BoardRevision, OT3Mount
from . import modules

if TYPE_CHECKING:
    from .api import API
    from .ot3api import OT3API


log = logging.getLogger(__name__)

MODULE_PORT_REGEX = re.compile(
    # add a negative lookbehind to suppress matches on OT-2 tempfiles udev creates
    r"(?<!\.#ot_module_)"
    # capture all modules by name using alternation
    + "(" + "|".join(modules.MODULE_TYPE_BY_NAME.keys()) + ")"
    # add a negative lookahead to suppress matches on Flex tempfiles udev creates
    + r"\d+(?!\.tmp-c\d+:\d+)",
    re.I,
)


class AttachedModulesControl:
    """
    A class to handle monitoring module attachment, capturing the physical
    USB port information and finally building a module object.
    """

    def __init__(
        self,
        api: Union["API", "OT3API"],
        usb: interfaces.USBDriverInterface,
    ) -> None:
        self._available_modules: List[modules.AbstractModule] = []
        self._api = api
        self._usb = usb

    @classmethod
    async def build(
        cls,
        api_instance: Union["API", "OT3API"],
        board_revision: BoardRevision,
    ) -> AttachedModulesControl:
        usb_instance = (
            usb.USBBus(board_revision)
            if not api_instance.is_simulator and IS_ROBOT
            else usb_simulator.USBBusSimulator()
        )
        mc_instance = cls(api=api_instance, usb=usb_instance)

        if not api_instance.is_simulator:
            # Do an initial scan of modules.
            await mc_instance.register_modules(mc_instance.scan())
            if not IS_ROBOT:
                # Start task that registers emulated modules.
                api_instance.loop.create_task(
                    listen_module_connection(mc_instance.register_modules)
                )

        return mc_instance

    @property
    def available_modules(self) -> List[modules.AbstractModule]:
        return self._available_modules

    async def build_module(
        self,
        port: str,
        usb_port: types.USBPort,
        type: modules.ModuleType,
        sim_model: Optional[str] = None,
        sim_serial_number: Optional[str] = None,
    ) -> modules.AbstractModule:
        return await modules.build(
            port=port,
            usb_port=usb_port,
            type=type,
            simulating=self._api.is_simulator,
            hw_control_loop=self._api.loop,
            execution_manager=self._api._execution_manager,
            sim_model=sim_model,
            sim_serial_number=sim_serial_number,
        )

    async def unregister_modules(
        self,
        mods_at_ports: Union[
            List[modules.ModuleAtPort], List[modules.SimulatingModuleAtPort]
        ],
    ) -> None:
        """
        De-register Modules.

        Remove any modules that are no longer found by aionotify.
        """
        removed_modules = []
        for mod in mods_at_ports:
            for attached_mod in self.available_modules:
                if attached_mod.port == mod.port:
                    removed_modules.append(attached_mod)
        for removed_mod in removed_modules:
            try:
                self._available_modules.remove(removed_mod)
            except ValueError:
                log.exception(
                    f"Removed Module {removed_mod} not found in attached modules"
                )
        for removed_mod in removed_modules:
            log.info(
                f"Module {removed_mod.name()} detached from port {removed_mod.port}"
            )
            await removed_mod.cleanup()
        self._available_modules = sorted(
            self._available_modules, key=modules.AbstractModule.sort_key
        )

    async def register_modules(
        self,
        new_mods_at_ports: Optional[
            Union[List[modules.ModuleAtPort], List[modules.SimulatingModuleAtPort]]
        ] = None,
        removed_mods_at_ports: Optional[List[modules.ModuleAtPort]] = None,
    ) -> None:
        """
        Register Modules.

        Upon system recognition of a module being plugged in, we should
        register that module and de-register any modules that are
        no longer found on the system.
        """
        if new_mods_at_ports is None:
            new_mods_at_ports = []
        if removed_mods_at_ports is None:
            removed_mods_at_ports = []

        # destroy removed mods
        await self.unregister_modules(removed_mods_at_ports)
        self._new_mods_at_ports = new_mods_at_ports
        unsorted_mods_at_port = self._usb.match_virtual_ports(new_mods_at_ports)

        # build new mods
        for mod in unsorted_mods_at_port:
            new_instance = await self.build_module(
                port=mod.port,
                usb_port=mod.usb_port,
                type=modules.MODULE_TYPE_BY_NAME[mod.name],
                sim_serial_number=(
                    mod.serial_number
                    if isinstance(mod, SimulatingModuleAtPort)
                    else None
                ),
                sim_model=(
                    mod.model if isinstance(mod, SimulatingModuleAtPort) else None
                ),
            )
            self._available_modules.append(new_instance)
            log.info(
                f"Module {mod.name} discovered and attached"
                f" at port {mod.port}, new_instance: {new_instance}"
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
            module_at_port = self.get_module_at_port(symlink_port)
            if module_at_port:
                discovered_modules.append(module_at_port)

        log.debug("Discovered modules: {}".format(discovered_modules))
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

    async def handle_module_appearance(self, event: AionotifyEvent) -> None:
        """Only called upon availability of aionotify. Check that
        the file system has changed and either remove or add modules
        depending on the result.

        Args:
            event: The event passed from aionotify.

        Returns:
            None
        """
        maybe_module_at_port = self.get_module_at_port(event.name)
        new_modules = None
        removed_modules = None
        if maybe_module_at_port is not None:
            if hasattr(event.flags, "DELETE") or hasattr(event.flags, "MOVED_FROM"):
                removed_modules = [maybe_module_at_port]
                log.info(f"Module Removed: {maybe_module_at_port}")
            elif hasattr(event.flags, "CREATE") or hasattr(event.flags, "MOVED_TO"):
                new_modules = [maybe_module_at_port]
                log.info(f"Module Added: {maybe_module_at_port}")
            try:
                await self.register_modules(
                    removed_mods_at_ports=removed_modules,
                    new_mods_at_ports=new_modules,
                )
            except Exception:
                log.exception("Exception in Module registration")

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
