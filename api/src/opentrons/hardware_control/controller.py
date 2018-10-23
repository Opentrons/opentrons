import asyncio
import os
import fcntl
import threading
from typing import Any, Dict, List, Optional, Tuple
from opentrons.util import environment
from opentrons.drivers.smoothie_drivers import driver_3_0
from opentrons.config import robot_configs
from opentrons.types import Mount
from . import modules
from .types import Axis


_lock = threading.Lock()


class _Locker:
    """ A class that combines a threading.Lock and a file lock to ensure
    controllers are unique both between processes and within a process.

    There should be one instance of this per process.
    """
    LOCK_FILE_PATH = environment.settings['HARDWARE_CONTROLLER_LOCKFILE']

    def __init__(self):
        global _lock

        self._thread_lock_acquired = _lock.acquire(blocking=False)
        self._file_lock_acquired = self._try_acquire_file_lock()
        if not (self._thread_lock_acquired and self._file_lock_acquired):
            raise RuntimeError(
                'Only one hardware controller may be instantiated')

    def _try_acquire_file_lock(self):
        self._file = open(self.LOCK_FILE_PATH, 'w')
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

    def __init__(self, config, loop):
        """ Build a Controller instance.

        If another controller is already instantiated on the system (or if
        this is instantiated somewhere other than a robot) then this method
        will raise a RuntimeError.
        """
        if not os.environ.get('RUNNING_ON_PI'):
            raise RuntimeError('{} may only be instantiated on a robot'
                               .format(self.__class__.__name__))
        self._lock = _Locker()
        self.config = config or robot_configs.load()
        self._smoothie_driver = driver_3_0.SmoothieDriver_3_0_0(
            config=self.config)
        self._attached_modules = {}

    def move(self, target_position: Dict[str, float], home_flagged_axes=True):
        self._smoothie_driver.move(
            target_position, home_flagged_axes=home_flagged_axes)

    def home(self, axes: List[Axis] = None) -> Dict[str, float]:
        if axes:
            args: Tuple[Any, ...] = (''.join([ax.name for ax in axes]),)
        else:
            args = tuple()
        return self._smoothie_driver.home(*args)

    def get_attached_instruments(
            self, expected: Dict[Mount, str]) -> Dict[Mount, Optional[str]]:
        """ Find the instruments attached to our mounts.

        :param expected: A dict that may contain a mapping from mount to
                         strings that should prefix instrument model names.
                         When instruments are scanned, they are matched
                         against the expectation (if present) and a
                         :py:attr:`RuntimeError` is raised if there is no
                         match.

        :raises RuntimeError: If an instrument is expected but not found.
        :returns: A dict of mount to either instrument model names or `None`.
        """
        to_return: Dict[Mount, Optional[str]] = {}
        for mount in Mount:
            found = self._smoothie_driver.read_pipette_model(
                mount.name.lower())
            expected_instr = expected.get(mount, None)
            if expected_instr and\
               (not found or not found.startswith(expected_instr)):
                raise RuntimeError(
                    'mount {}: expected instrument {} but got {}'
                    .format(mount.name, expected_instr, found))
            to_return[mount] = found
        return to_return

    def set_active_current(self, axis, amp):
        self._smoothie_driver.set_active_current({axis.name: amp})

    def set_pipette_speed(self, val: float):
        self._smoothie_driver.set_speed(val)

    def get_attached_modules(self) -> List[Tuple[str, str]]:
        return modules.discover()

    def build_module(self, port: str, model: str) -> modules.AbstractModule:
        return modules.build(port, model, False)

    async def update_module(
            self,
            module: modules.AbstractModule,
            firmware_file: str,
            loop: Optional[asyncio.AbstractEventLoop])\
            -> modules.AbstractModule:
        return await modules.update_firmware(
            module, firmware_file, loop)

    def _connect(self):
        self._smoothie_driver.connect()
