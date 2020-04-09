import asyncio
import copy
import logging
from threading import Event
from typing import Dict, Optional, List, Tuple, TYPE_CHECKING
from contextlib import contextmanager
from opentrons import types
from opentrons.config.pipette_config import (config_models,
                                             config_names,
                                             configs)
from opentrons.drivers.smoothie_drivers import SimulatingDriver
from . import modules
from .execution_manager import ExecutionManager
if TYPE_CHECKING:
    from .dev_types import RegisterModules  # noqa (F501)


MODULE_LOG = logging.getLogger(__name__)


def find_config(prefix: str) -> str:
    """ Find the most recent config matching `prefix` """
    if prefix in config_models:
        return prefix

    # We need to check for the nickname of pipettes if the prefix given
    # is not the exact model. This is because gen2 nicknames are not
    # subsets of gen2 pipette model strings.
    matches = [conf for conf in config_models
               if configs[conf]['name'].startswith(prefix)]

    if not matches:
        raise KeyError('No match found for prefix {}'.format(prefix))
    else:
        return sorted(matches)[0]


_HOME_POSITION = {'X': 418.0, 'Y': 353.0, 'Z': 218.0,
                  'A': 218.0, 'B': 19.0, 'C': 19.0}


class Simulator:
    """ This is a subclass of hardware_control that only simulates the
    hardware actions. It is suitable for use on a dev machine or on
    a robot with no smoothie connected.
    """

    def __init__(
            self,
            attached_instruments: Dict[types.Mount, Dict[str, Optional[str]]],
            attached_modules: List[str],
            config, loop,
            strict_attached_instruments=True) -> None:
        """ Build the simulator.

        :param attached_instruments: A dictionary describing the instruments
                                     the simulator should consider attached.
                                     If this argument is specified and
                                     :py:meth:`get_attached_instruments` is
                                     called with expectations that do not
                                     match, the call fails. This is useful for
                                     making the simulator match the real
                                     hardware, for instance to check if a
                                     protocol asks for the right instruments.
                                     This dict should map mounts to either
                                     empty dicts or to dicts containing
                                     'model' and 'id' keys.
        :param attached_modules: A list of module model names (e.g.
                                 `'tempdeck'` or `'magdeck'`) representing
                                 modules the simulator should assume are
                                 attached. Like `attached_instruments`, used
                                 to make the simulator match the setup of the
                                 real hardware.
        :param config: The robot config to use
        :param loop: The asyncio event loop to use.
        :param strict_attached_instruments: This param changes the behavior of
                                            the instrument cache. If ``True``,
                                            (default), ``cache_instrument``
                                            calls requesting instruments not
                                            in ``attached_instruments`` will
                                            fail as if the instrument was not
                                            present. If ``False``, those calls
                                            will still pass but give a response
                                            version of 1, while calls
                                            requesting instruments that _are_
                                            present get the full number.
        """
        self._config = config
        self._loop = loop
        self._attached_instruments = attached_instruments
        self._stubbed_attached_modules = attached_modules
        self._position = copy.copy(_HOME_POSITION)
        # Engaged axes start all true in smoothie for some reason so we
        # imitate that here
        # TODO(LC2642019) Create a simulating driver for smoothie instead of
        # using a flag
        self._smoothie_driver = SimulatingDriver()
        self._engaged_axes = {ax: True for ax in _HOME_POSITION}
        self._lights = {'button': False, 'rails': False}
        self._run_flag = Event()
        self._run_flag.set()
        self._log = MODULE_LOG.getChild(repr(self))
        self._strict_attached = bool(strict_attached_instruments)

    def update_position(self) -> Dict[str, float]:
        return self._position

    def move(self, target_position: Dict[str, float],
             home_flagged_axes: bool = True, speed: float = None,
             axis_max_speeds: Dict[str, float] = None):
        self._position.update(target_position)
        self._engaged_axes.update({ax: True
                                   for ax in target_position})

    def home(self, axes: List[str] = None) -> Dict[str, float]:
        # driver_3_0-> HOMED_POSITION
        checked_axes = axes or 'XYZABC'
        self._position.update({ax: _HOME_POSITION[ax]
                               for ax in checked_axes})
        self._engaged_axes.update({ax: True
                                   for ax in checked_axes})
        return self._position

    def fast_home(self, axis: str, margin: float) -> Dict[str, float]:
        self._position[axis] = _HOME_POSITION[axis]
        self._engaged_axes[axis] = True
        return self._position

    def get_attached_instruments(
            self, expected: Dict[types.Mount, str])\
            -> Dict[types.Mount, Dict[str, Optional[str]]]:
        """ Update the internal cache of attached instruments.

        This method allows after-init-time specification of attached simulated
        instruments. The method will return
        - the instruments specified at init-time, or if those do not exists,
        - the instruments specified in expected, or if that is not passed,
        - nothing

        :param expected: A mapping of mount to instrument model prefixes. When
                         loading instruments from a prefix, we return the
                         lexically-first model that matches the prefix. If the
                         models specified in expected do not match the models
                         specified in the `attached_instruments` argument of
                         :py:meth:`__init__`, :py:attr:`RuntimeError` is
                         raised.
        :raises RuntimeError: If an instrument is expected but not found.
        :returns: A dict of mount to either instrument model names or `None`.
        """
        to_return: Dict[types.Mount, Dict[str, Optional[str]]] = {}
        for mount in types.Mount:

            expected_instr = expected.get(mount, None)
            if expected_instr and expected_instr not in\
               config_models + config_names:
                raise RuntimeError(
                    f'mount {mount.name}: invalid pipette type'
                    f' {expected_instr}')
            init_instr = self._attached_instruments.get(mount, {})
            found_model = init_instr.get('model', '')
            back_compat: List[str] = []
            if found_model:
                back_compat = configs[found_model].get('backCompatNames', [])
            if expected_instr and found_model\
                    and (not found_model.startswith(expected_instr)
                         and expected_instr not in back_compat):
                if self._strict_attached:
                    raise RuntimeError(
                        'mount {}: expected instrument {} but got {}'
                        .format(mount.name, expected_instr, found_model))
                else:
                    to_return[mount] = {
                        'model': find_config(expected_instr),
                        'id': None}
            elif found_model and expected_instr:
                # Instrument detected matches instrument expected (note:
                # "instrument detected" means passed as an argument to the
                # constructor of this class)
                to_return[mount] = init_instr
            elif found_model:
                # Instrument detected and no expected instrument specified
                to_return[mount] = init_instr
            elif expected_instr:
                # Expected instrument specified and no instrument detected
                to_return[mount] = {
                    'model': find_config(expected_instr),
                    'id': None}
            else:
                # No instrument detected or expected
                to_return[mount] = {
                    'model': None,
                    'id': None}
        return to_return

    def set_active_current(self, axis, amp):
        pass

    async def watch_modules(self, register_modules: 'RegisterModules'):
        new_mods_at_ports = [
            modules.ModuleAtPort(
                port=f'/dev/ot_module_sim_{mod}{str(idx)}', name=mod)
            for idx, mod
            in enumerate(self._stubbed_attached_modules)]
        await register_modules(new_mods_at_ports=new_mods_at_ports)

    @contextmanager
    def save_current(self):
        yield

    async def build_module(
            self,
            port: str,
            model: str,
            interrupt_callback: modules.InterruptCallback,
            loop: asyncio.AbstractEventLoop,
            execution_manager: ExecutionManager,
            sim_model: str = None
            ) -> modules.AbstractModule:
        return await modules.build(
            port=port,
            which=model,
            simulating=True,
            interrupt_callback=interrupt_callback,
            loop=loop,
            execution_manager=execution_manager,
            sim_model=sim_model)

    @property
    def axis_bounds(self) -> Dict[str, Tuple[float, float]]:
        """ The (minimum, maximum) bounds for each axis. """
        return {ax: (0, pos + 0.5) for ax, pos in _HOME_POSITION.items()
                if ax not in 'BC'}

    @property
    def fw_version(self) -> Optional[str]:
        return 'Virtual Smoothie'

    async def update_fw_version(self):
        pass

    async def update_firmware(self, filename, loop, modeset) -> str:
        return 'Did nothing (simulating)'

    def engaged_axes(self):
        return self._engaged_axes

    def disengage_axes(self, axes: List[str]):
        self._engaged_axes.update({ax: False for ax in axes})

    def set_lights(self, button: Optional[bool], rails: Optional[bool]):
        if button is not None:
            self._lights['button'] = button
        if rails is not None:
            self._lights['rails'] = rails

    def get_lights(self) -> Dict[str, bool]:
        return self._lights

    async def identify(self):
        pass

    def pause(self):
        self._run_flag.clear()

    def resume(self):
        self._run_flag.set()

    def halt(self):
        self._run_flag.set()

    def hard_halt(self):
        self._run_flag.set()

    def probe(self, axis: str, distance: float) -> Dict[str, float]:
        self._position[axis.upper()] = self._position[axis.upper()] + distance
        return self._position

    # NOTE: this function is here for legacy support, delays are now
    # handled at the hardware control api level
    async def delay(self, duration_s: int):
        """ Pause and unpause, but without the actual delay """
        self.pause()
        self.resume()
