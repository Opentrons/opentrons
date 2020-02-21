import asyncio
from contextlib import contextmanager, ExitStack
import logging
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING
try:
    import aionotify  # type: ignore
except OSError:
    aionotify = None  # type: ignore

from opentrons.drivers.smoothie_drivers import driver_3_0
from opentrons.drivers.rpi_drivers import gpio
import opentrons.config
from opentrons.types import Mount

from . import modules

if TYPE_CHECKING:
    from .dev_types import RegisterModules  # noqa (F501)

MODULE_LOG = logging.getLogger(__name__)


class Controller:
    """ The concrete instance of the controller for actually controlling
    hardware.
    """

    def __init__(self, config):
        """ Build a Controller instance.

        If another controller is already instantiated on the system (or if
        this is instantiated somewhere other than a robot) then this method
        will raise a RuntimeError.
        """
        import threading
        print(f'CONTROLLER INIT. {threading.currentThread().getName()}')
        if not opentrons.config.IS_ROBOT:
            MODULE_LOG.warning(
                'This is intended to run on a robot, and while it can connect '
                'to a smoothie via a usb/serial adapter unexpected things '
                'using gpios (such as smoothie reset or light management) '
                'will fail')

        self.config = config or opentrons.config.robot_configs.load()
        # We handle our own locks in the hardware controller thank you
        self._smoothie_driver = driver_3_0.SmoothieDriver_3_0_0(
            config=self.config, handle_locks=False)
        self._cached_fw_version: Optional[str] = None
        try:
            self._module_watcher = aionotify.Watcher()
            self._module_watcher.watch(
                alias='modules',
                path='/dev',
                flags=(aionotify.Flags.CREATE | aionotify.Flags.DELETE))
        except AttributeError:
            MODULE_LOG.warning(
                'Failed to initiate aionotify, cannot watch modules,'
                'likely because not running on linux')

    def update_position(self) -> Dict[str, float]:
        self._smoothie_driver.update_position()
        return self._smoothie_driver.position

    def move(self, target_position: Dict[str, float],
             home_flagged_axes: bool = True, speed: float = None,
             axis_max_speeds: Dict[str, float] = None):
        with ExitStack() as cmstack:
            if axis_max_speeds:
                cmstack.enter_context(
                    self._smoothie_driver.restore_axis_max_speed(
                        axis_max_speeds))
            self._smoothie_driver.move(
                target_position, home_flagged_axes=home_flagged_axes,
                speed=speed)

    def home(self, axes: List[str] = None) -> Dict[str, float]:
        if axes:
            args: Tuple[Any, ...] = (''.join(axes),)
        else:
            args = tuple()
        return self._smoothie_driver.home(*args)

    def fast_home(self, axis: str, margin: float) -> Dict[str, float]:
        return self._smoothie_driver.fast_home(axis, margin)

    def get_attached_instruments(
            self, expected: Dict[Mount, str])\
            -> Dict[Mount, Dict[str, Optional[str]]]:
        """ Find the instruments attached to our mounts.
        :param expected: is ignored, it is just meant to enforce
                          the same interface as the simulator, where
                          required instruments can be manipulated.

        :returns: A dict with mounts as the top-level keys. Each mount value is
            a dict with keys 'model' (containing an instrument model name or
            `None`) and 'id' (containing the serial number of the pipette
            attached to that mount, or `None`).
        """
        to_return: Dict[Mount, Dict[str, Optional[str]]] = {}
        for mount in Mount:
            found_model = self._smoothie_driver.read_pipette_model(
                mount.name.lower())
            found_id = self._smoothie_driver.read_pipette_id(
                mount.name.lower())
            to_return[mount] = {
                'model': found_model,
                'id': found_id}
        return to_return

    def set_active_current(self, axis, amp):
        """
        This method sets only the 'active' current, i.e., the current for an
        axis' movement. Smoothie driver automatically resets the current for
        pipette axis to a low current (dwelling current) after each move
        """
        self._smoothie_driver.set_active_current({axis.name: amp})

    @contextmanager
    def save_current(self):
        self._smoothie_driver.push_active_current()
        try:
            yield
        finally:
            self._smoothie_driver.pop_active_current()

    def set_pipette_speed(self, val: float):
        self._smoothie_driver.set_speed(val)

    async def _handle_watch_event(self, register_modules: 'RegisterModules'):
        event = await self._module_watcher.get_event()
        flags = aionotify.Flags.parse(event.flags)
        if event is not None and 'ot_module' in event.name:
            maybe_module_at_port = modules.get_module_at_port(event.name)
            new_modules = None
            removed_modules = None
            if maybe_module_at_port is not None:
                if aionotify.Flags.DELETE in flags:
                    removed_modules = [maybe_module_at_port]
                    MODULE_LOG.info(
                        f'Module Removed: {maybe_module_at_port}')
                elif aionotify.Flags.CREATE in flags:
                    new_modules = [maybe_module_at_port]
                    MODULE_LOG.info(
                        f'Module Added: {maybe_module_at_port}')
                try:
                    await register_modules(
                        removed_mods_at_ports=removed_modules,
                        new_mods_at_ports=new_modules,
                    )
                except Exception:
                    MODULE_LOG.exception(
                        'Exception in Module registration')

    async def watch_modules(self, loop: asyncio.AbstractEventLoop,
                            register_modules: 'RegisterModules'):
        can_watch = aionotify is not None
        if can_watch:
            await self._module_watcher.setup(loop)

        initial_modules = modules.discover()
        try:
            await register_modules(new_mods_at_ports=initial_modules)
        except Exception:
            MODULE_LOG.exception('Exception in Module registration')
        while can_watch and (not self._module_watcher.closed):
            await self._handle_watch_event(register_modules)

    async def build_module(
            self,
            port: str,
            model: str,
            interrupt_callback: modules.InterruptCallback
            ) -> modules.AbstractModule:
        return await modules.build(
            port=port,
            which=model,
            simulating=False,
            interrupt_callback=interrupt_callback)

    async def connect(self, port: str = None):
        self._smoothie_driver.connect(port)
        await self.update_fw_version()

    @property
    def axis_bounds(self) -> Dict[str, Tuple[float, float]]:
        """ The (minimum, maximum) bounds for each axis. """
        return {ax: (0, pos + .05) for ax, pos
                in self._smoothie_driver.homed_position.items()
                if ax not in 'BC'}

    @property
    def fw_version(self) -> Optional[str]:
        return self._cached_fw_version

    async def update_fw_version(self):
        self._cached_fw_version = self._smoothie_driver.get_fw_version()

    async def update_firmware(self,
                              filename: str,
                              loop: asyncio.AbstractEventLoop,
                              modeset: bool) -> str:
        msg = await self._smoothie_driver.update_firmware(
            filename, loop, modeset)
        await self.update_fw_version()
        return msg

    def engaged_axes(self) -> Dict[str, bool]:
        return self._smoothie_driver.engaged_axes

    def disengage_axes(self, axes: List[str]):
        self._smoothie_driver.disengage_axis(''.join(axes))

    def set_lights(self, button: Optional[bool], rails: Optional[bool]):
        if opentrons.config.IS_ROBOT:
            if button is not None:
                gpio.set_button_light(blue=button)
            if rails is not None:
                gpio.set_rail_lights(rails)

    def get_lights(self) -> Dict[str, bool]:
        if not opentrons.config.IS_ROBOT:
            return {}
        return {'button': gpio.get_button_light()[2],
                'rails': gpio.get_rail_lights()}

    def pause(self):
        self._smoothie_driver.pause()

    def resume(self):
        self._smoothie_driver.resume()

    def halt(self):
        self._smoothie_driver.kill()

    def hard_halt(self):
        self._smoothie_driver.hard_halt()

    def probe(self, axis: str, distance: float) -> Dict[str, float]:
        """ Run a probe and return the new position dict
        """
        return self._smoothie_driver.probe_axis(axis, distance)

    async def delay(self, duration_s: int):
        """ Pause and sleep
        """
        self.pause()
        await asyncio.sleep(duration_s)
        self.resume()

    def __del__(self):
        if hasattr(self, '_module_watcher'):
            loop = asyncio.get_event_loop()
            if loop.is_running() and self._module_watcher:
                self._module_watcher.close()
