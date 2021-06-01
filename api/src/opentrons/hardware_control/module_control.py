import logging
import asyncio
import os
import re
from typing import List, Tuple, Optional
from glob import glob

from opentrons.config import IS_ROBOT, IS_LINUX
from opentrons.drivers.rpi_drivers import types
from opentrons.hardware_control.modules import ModuleAtPort

from .execution_manager import ExecutionManager
from .types import AionotifyEvent
from . import modules


log = logging.getLogger(__name__)

MODULE_PORT_REGEX = re.compile('|'.join(modules.MODULE_HW_BY_NAME.keys()), re.I)


class AttachedModulesControl:
    """
    A class to handle monitoring module attachment, capturing the physical
    USB port information and finally building a module object.
    """

    def __init__(self, api):
        self._available_modules: List[modules.AbstractModule] = []
        self._api = api

    @classmethod
    async def build(cls, api_instance):
        mc_instance = cls(api_instance)
        if not api_instance.is_simulator:
            await mc_instance.register_modules(mc_instance.scan())
        return mc_instance

    @property
    def available_modules(self) -> List[modules.AbstractModule]:
        return self._available_modules

    @property
    def api(self):
        return self._api

    async def build_module(
            self,
            port: str,
            usb_port: types.USBPort,
            model: str,
            loop: asyncio.AbstractEventLoop,
            sim_model: str = None
            ) -> modules.AbstractModule:
        return await modules.build(
            port=port,
            usb_port=usb_port,
            which=model,
            simulating=self.api.is_simulator,
            interrupt_callback=self.api.pause_with_message,
            loop=loop,
            execution_manager=self.api._execution_manager,
            sim_model=sim_model)

    def unregister_modules(self,
                           mods_at_ports: List[modules.ModuleAtPort]) -> None:
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
                log.exception(f"Removed Module {removed_mod} not"
                              " found in attached modules")
        for removed_mod in removed_modules:
            log.info(f"Module {removed_mod.name()} detached"
                     f" from port {removed_mod.port}")
            del removed_mod

    async def register_modules(
            self,
            new_mods_at_ports: List[modules.ModuleAtPort] = None,
            removed_mods_at_ports: List[modules.ModuleAtPort] = None
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
        self.unregister_modules(removed_mods_at_ports)
        sorted_mods_at_port =\
            self.api._backend._usb.match_virtual_ports(new_mods_at_ports)

        # build new mods
        for mod in sorted_mods_at_port:
            new_instance = await self.build_module(
                    port=mod.port,
                    usb_port=mod.usb_port,
                    model=mod.name,
                    loop=self.api.loop)
            self._available_modules.append(new_instance)
            log.info(f"Module {mod.name} discovered and attached"
                     f" at port {mod.port}, new_instance: {new_instance}")

    async def parse_modules(
                self, by_model: modules.types.ModuleModel,
                resolved_type: modules.types.ModuleType
    ) -> Tuple[List[modules.AbstractModule], Optional[modules.AbstractModule]]:
        """
        Parse Modules.
        Given a module model and type, find all attached
        modules that fit this criteria. If there are no
        modules attached, but the module is being loaded
        in simulation, then it should return a simulating
        module of the same type.
        """
        matching_modules = []
        simulated_module = None
        mod_type = {
            modules.types.ModuleType.MAGNETIC: 'magdeck',
            modules.types.ModuleType.TEMPERATURE: 'tempdeck',
            modules.types.ModuleType.THERMOCYCLER: 'thermocycler'
        }[resolved_type]
        for module in self.available_modules:
            if mod_type == module.name():
                matching_modules.append(module)
        if self.api.is_simulator:
            mod_class = {
                'magdeck': modules.MagDeck,
                'tempdeck': modules.TempDeck,
                'thermocycler': modules.Thermocycler
            }[mod_type]
            simulating_module = mod_class(
                port='',
                usb_port=self.api._backend._usb.find_port(''),
                simulating=True,
                loop=self.api.loop,
                execution_manager=ExecutionManager(
                    loop=self.api.loop),
                sim_model=by_model.value)
            await simulating_module._connect()
            simulated_module = simulating_module
        return matching_modules, simulated_module

    def scan(self) -> List[modules.ModuleAtPort]:
        """ Scan for connected modules and return list of
            tuples of serial ports and device names
        """
        if IS_ROBOT and IS_LINUX:
            devices = glob('/dev/ot_module*')
        else:
            devices = []

        discovered_modules = []

        for port in devices:
            symlink_port = port.split('dev/')[1]
            module_at_port = self.get_module_at_port(symlink_port)
            if module_at_port:
                discovered_modules.append(module_at_port)

        # Check for emulator environment variables
        emulator_uri = os.environ.get("OT_THERMOCYCLER_EMULATOR_URI")
        if emulator_uri:
            discovered_modules.append(
                ModuleAtPort(port=emulator_uri, name="thermocycler")
            )

        emulator_uri = os.environ.get("OT_TEMPERATURE_EMULATOR_URI")
        if emulator_uri:
            discovered_modules.append(
                ModuleAtPort(port=emulator_uri, name="tempdeck")
            )

        emulator_uri = os.environ.get("OT_MAGNETIC_EMULATOR_URI")
        if emulator_uri:
            discovered_modules.append(
                ModuleAtPort(port=emulator_uri, name="magdeck")
            )

        log.debug('Discovered modules: {}'.format(discovered_modules))
        return discovered_modules

    @staticmethod
    def get_module_at_port(port: str) -> Optional[modules.ModuleAtPort]:
        """ Given a port, returns either a ModuleAtPort
            if it is a recognized module, or None if not recognized.
        """
        match = MODULE_PORT_REGEX.search(port)
        if match:
            name = match.group().lower()
            if name not in modules.MODULE_HW_BY_NAME:
                log.warning(f"Unexpected module connected: {name} on {port}")
                return None
            return modules.ModuleAtPort(port=f'dev/{port}', name=name)
        return None

    async def handle_module_appearance(self, event: AionotifyEvent):
        """ Only called upon availability of aionotify. Check that
        the file system has changed and either remove or add modules
        depending on the result.

        :param event_name: The title of the even passed into aionotify.
        :param event_flags: AionotifyFlags dataclass that maps flags listed from
        the aionotify event.
        """
        maybe_module_at_port = self.get_module_at_port(event.name)
        new_modules = None
        removed_modules = None
        if maybe_module_at_port is not None:
            if hasattr(event.flags, 'DELETE'):
                removed_modules = [maybe_module_at_port]
                log.info(
                    f'Module Removed: {maybe_module_at_port}')
            elif hasattr(event.flags, 'CREATE'):
                new_modules = [maybe_module_at_port]
                log.info(
                    f'Module Added: {maybe_module_at_port}')
            try:
                await self.register_modules(
                    removed_mods_at_ports=removed_modules,
                    new_mods_at_ports=new_modules,
                )
            except Exception:
                log.exception(
                    'Exception in Module registration')
