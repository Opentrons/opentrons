import asyncio
from contextlib import contextmanager
import fcntl
import threading
from typing import Any, Dict, List, Optional, Tuple

from opentrons.drivers.smoothie_drivers import driver_3_0
from opentrons.drivers.rpi_drivers import gpio
import opentrons.config
from opentrons.types import Mount

from . import modules

_lock = threading.Lock()


class _Locker:
    """ A class that combines a threading.Lock and a file lock to ensure
    controllers are unique both between processes and within a process.

    There should be one instance of this per process.
    """
    def __init__(self, force=False):
        global _lock

        self._thread_lock_acquired = _lock.acquire(blocking=False)
        self._file_lock_acquired = self._try_acquire_file_lock()
        if not (self._thread_lock_acquired and self._file_lock_acquired):
            raise RuntimeError(
                'Only one hardware controller may be instantiated')

    def _try_acquire_file_lock(self):
        self._file = open(
            opentrons.config.CONFIG['hardware_controller_lockfile'],
            'w')
        try:
            fcntl.lockf(self._file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            return False
        else:
            return True

    def __del__(self):
        global _lock
        if self._file_lock_acquired:
            fcntl.lockf(self._file, fcntl.LOCK_UN)
        if self._thread_lock_acquired:
            _lock.release()


class Controller:
    """ The concrete instance of the controller for actually controlling
    hardware.

    This class may only be instantiated on a robot, and only one instance
    may be active at any time.
    """

    def __init__(self, config, loop, force=False):
        """ Build a Controller instance.

        If another controller is already instantiated on the system (or if
        this is instantiated somewhere other than a robot) then this method
        will raise a RuntimeError.

        If `force` is specified as `True`, delete the lockfile and connect
        anyway. This is intended specifically for the purpose of fixing an
        issue where the update server connects to get the smoothie firmware
        version but does not disconnect. It should only be specified true
        by the opentrons main server process.
        """
        if not opentrons.config.IS_ROBOT:
            raise RuntimeError('{} may only be instantiated on a robot'
                               .format(self.__class__.__name__))
        try:
            self._lock = _Locker()
        except RuntimeError:
            if force:
                self._lock = None
            else:
                raise

        self.config = config or opentrons.config.robot_configs.load()
        # We handle our own locks in the hardware controller thank you
        self._smoothie_driver = driver_3_0.SmoothieDriver_3_0_0(
            config=self.config, handle_locks=False)
        self._cached_fw_version: Optional[str] = None

    def move(self, target_position: Dict[str, float],
             home_flagged_axes: bool = True, speed: float = None):
        with self._set_temp_speed(speed):
            self._smoothie_driver.move(
                target_position, home_flagged_axes=home_flagged_axes)

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

        :param expected: A dict that may contain a mapping from mount to
                         strings that should prefix instrument model names.
                         When instruments are scanned, they are matched
                         against the expectation (if present) and a
                         :py:attr:`RuntimeError` is raised if there is no
                         match.

        :raises RuntimeError: If an instrument is expected but not found.
        :returns: A dict with mounts as the top-level keys. Each mount value is
            a dict with keys 'mount' (containing an instrument model name or
            `None`) and 'id' (containing the serial number of the pipette
            attached to that mount, or `None`).
        """
        to_return: Dict[Mount, Dict[str, Optional[str]]] = {}
        for mount in Mount:
            found_model = self._smoothie_driver.read_pipette_model(
                mount.name.lower())
            found_id = self._smoothie_driver.read_pipette_id(
                mount.name.lower())
            expected_instr = expected.get(mount, None)
            if expected_instr and\
               (not found_model or not found_model.startswith(expected_instr)):
                raise RuntimeError(
                    'mount {}: instrument {} was requested but {} is present'
                    .format(mount.name, expected_instr, found_model))
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

    def get_attached_modules(self) -> List[Tuple[str, str]]:
        return modules.discover()

    async def build_module(self,
                           port: str,
                           model: str,
                           interrupt_callback) -> modules.AbstractModule:
        return await modules.build(
            port=port,
            which=model,
            simulating=False,
            interrupt_callback=interrupt_callback)

    async def update_module(
            self,
            module: modules.AbstractModule,
            firmware_file: str,
            loop: Optional[asyncio.AbstractEventLoop])\
            -> modules.AbstractModule:
        return await modules.update_firmware(
            module, firmware_file, loop)

    async def connect(self, port: str = None):
        self._smoothie_driver.connect(port)
        await self.update_fw_version()

    @contextmanager
    def _set_temp_speed(self, speed):
        if not speed:
            yield
        else:
            self._smoothie_driver.push_speed()
            self._smoothie_driver.set_speed(speed)
            try:
                yield
            finally:
                self._smoothie_driver.pop_speed()

    @property
    def axis_bounds(self) -> Dict[str, Tuple[float, float]]:
        """ The (minimum, maximum) bounds for each axis. """
        return {ax: (0, pos+.05) for ax, pos
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
        self._smoothie_driver.resume()

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
