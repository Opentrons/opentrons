import asyncio
import contextlib
from dataclasses import replace
from functools import partial
import logging
import pathlib
from collections import OrderedDict
from typing import (
    Callable,
    Dict,
    Union,
    List,
    Optional,
    Tuple,
    Sequence,
    Set,
)

from opentrons_shared_data.pipette import name_config
from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons import types as top_types
from opentrons.util import linal
from opentrons.config import robot_configs
from opentrons.config.types import RobotConfig

from .util import use_or_initialize_loop, check_motion_bounds
from .pipette import generate_hardware_configs, load_from_config_and_check_skip
from .controller import Controller
from .simulator import Simulator
from .constants import (
    SHAKE_OFF_TIPS_SPEED,
    SHAKE_OFF_TIPS_DROP_DISTANCE,
    SHAKE_OFF_TIPS_PICKUP_DISTANCE,
    DROP_TIP_RELEASE_DISTANCE,
)
from .execution_manager import ExecutionManagerProvider
from .pause_manager import PauseManager
from .module_control import AttachedModulesControl
from .types import (
    Axis,
    CriticalPoint,
    MustHomeError,
    DoorState,
    DoorStateNotification,
    ErrorMessageNotification,
    HardwareEventHandler,
    PipettePair,
    HardwareAction,
    PairedPipetteConfigValueError,
    MotionChecks,
    PauseType,
)
from . import modules
from .robot_calibration import RobotCalibrationProvider, load_pipette_offset
from .protocols import HardwareControlAPI
from .instrument_handler import InstrumentHandlerProvider
from .motion_utilities import (
    target_position_from_absolute,
    target_position_from_relative,
    target_position_from_plunger,
)


mod_log = logging.getLogger(__name__)


class API(
    ExecutionManagerProvider, RobotCalibrationProvider, InstrumentHandlerProvider
):
    """This API is the primary interface to the hardware controller.

    Because the hardware manager controls access to the system's hardware
    as a whole, it is designed as a class of which only one should be
    instantiated at a time. This class's methods should be the only method
    of external access to the hardware. Each method may be minimal - it may
    only delegate the call to another submodule of the hardware manager -
    but its purpose is to be gathered here to provide a single interface.
    """

    CLS_LOG = mod_log.getChild("API")

    def __init__(
        self,
        backend: Union[Controller, Simulator],
        loop: asyncio.AbstractEventLoop,
        config: RobotConfig,
    ) -> None:
        """Initialize an API instance.

        This should rarely be explicitly invoked by an external user; instead,
        one of the factory methods build_hardware_controller or
        build_hardware_simulator should be used.
        """
        self._log = self.CLS_LOG.getChild(str(id(self)))
        self._config = config
        self._backend = backend
        self._loop = loop

        self._callbacks: Set[HardwareEventHandler] = set()
        # {'X': 0.0, 'Y': 0.0, 'Z': 0.0, 'A': 0.0, 'B': 0.0, 'C': 0.0}
        self._current_position: Dict[Axis, float] = {}

        self._last_moved_mount: Optional[top_types.Mount] = None
        # The motion lock synchronizes calls to long-running physical tasks
        # involved in motion. This fixes issue where for instance a move()
        # or home() call is in flight and something else calls
        # current_position(), which will not be updated until the move() or
        # home() call succeeds or fails.
        self._motion_lock = asyncio.Lock(loop=self._loop)
        self._door_state = DoorState.CLOSED
        self._pause_manager = PauseManager(self._door_state)
        ExecutionManagerProvider.__init__(self, loop, isinstance(backend, Simulator))
        RobotCalibrationProvider.__init__(self)
        InstrumentHandlerProvider.__init__(self)
        API._check_type(self)

    @staticmethod
    def _check_type(inst: HardwareControlAPI) -> None:
        """Do-nothing to provide early warning if the protocol is not satisfied.

        This class can't inherit from the HardwareControlAPI protocol if we're also
        doing multiple inheritance, because it confuses MRO - it looks like it should
        have all these functions, but they're defined to not do anything. That means
        that we don't get the early warning when the class doesn't fulfill the
        protocol.

        What we can do instead is this, a bogus function that exists to make mypy
        verify while parsing the class that it fulfilles the protocol.
        """
        pass

    @property
    def door_state(self) -> DoorState:
        return self._door_state

    @door_state.setter
    def door_state(self, door_state: DoorState):
        self._door_state = door_state

    def _update_door_state(self, door_state: DoorState):
        mod_log.info(f"Updating the window switch status: {door_state}")
        self.door_state = door_state
        self._pause_manager.set_door(self.door_state)
        for cb in self._callbacks:
            hw_event = DoorStateNotification(
                new_state=door_state, blocking=self._pause_manager.blocked_by_door
            )
            try:
                cb(hw_event)
            except Exception:
                mod_log.exception("Errored during door state event callback")

    def _reset_last_mount(self):
        self._last_moved_mount = None

    @classmethod
    async def build_hardware_controller(
        cls,
        config: RobotConfig = None,
        port: str = None,
        loop: asyncio.AbstractEventLoop = None,
        firmware: Tuple[pathlib.Path, str] = None,
    ) -> "API":
        """Build a hardware controller that will actually talk to hardware.

        This method should not be used outside of a real robot, and on a
        real robot only one true hardware controller may be active at one
        time.

        :param config: A config to preload. If not specified, load the default.
        :param port: A port to connect to. If not specified, the default port
                     (found by scanning for connected FT232Rs).
        :param loop: An event loop to use. If not specified, use the result of
                     :py:meth:`asyncio.get_event_loop`.
        """
        checked_loop = use_or_initialize_loop(loop)
        checked_config = config or robot_configs.load()
        backend = await Controller.build(checked_config)
        backend.set_lights(button=None, rails=False)

        async def blink():
            while True:
                backend.set_lights(button=True, rails=None)
                await asyncio.sleep(0.5)
                backend.set_lights(button=False, rails=None)
                await asyncio.sleep(0.5)

        blink_task = checked_loop.create_task(blink())
        try:
            try:
                await backend.connect(port)
                fw_version = backend.fw_version
            except Exception:
                mod_log.exception(
                    "Motor driver could not connect, reprogramming if possible"
                )
                fw_version = None

            if firmware is not None:
                if fw_version != firmware[1]:
                    await backend.update_firmware(str(firmware[0]), checked_loop, True)
                    await backend.connect(port)
            elif firmware is None and fw_version is None:
                msg = (
                    "Motor controller could not be connected and no "
                    "firmware was provided for (re)programming"
                )
                mod_log.error(msg)
                raise RuntimeError(msg)

            api_instance = cls(backend, loop=checked_loop, config=checked_config)
            await api_instance.cache_instruments()
            module_controls = await AttachedModulesControl.build(
                api_instance, board_revision=backend.board_revision
            )
            backend.module_controls = module_controls
            checked_loop.create_task(backend.watch(loop=checked_loop))
            backend.start_gpio_door_watcher(
                loop=checked_loop, update_door_state=api_instance._update_door_state
            )
            return api_instance
        finally:
            blink_task.cancel()
            try:
                await blink_task
            except asyncio.CancelledError:
                pass

    @classmethod
    async def build_hardware_simulator(
        cls,
        attached_instruments: Dict[top_types.Mount, Dict[str, Optional[str]]] = None,
        attached_modules: List[str] = None,
        config: RobotConfig = None,
        loop: asyncio.AbstractEventLoop = None,
        strict_attached_instruments: bool = True,
    ) -> "API":
        """Build a simulating hardware controller.

        This method may be used both on a real robot and on dev machines.
        Multiple simulating hardware controllers may be active at one time.
        """

        if None is attached_instruments:
            attached_instruments = {}

        if None is attached_modules:
            attached_modules = []

        checked_loop = use_or_initialize_loop(loop)
        checked_config = config or robot_configs.load()
        backend = await Simulator.build(
            attached_instruments,
            attached_modules,
            checked_config,
            checked_loop,
            strict_attached_instruments,
        )
        api_instance = cls(backend, loop=checked_loop, config=checked_config)
        await api_instance.cache_instruments()
        module_controls = await AttachedModulesControl.build(
            api_instance, board_revision=backend.board_revision
        )
        backend.module_controls = module_controls
        await backend.watch()
        return api_instance

    def __repr__(self):
        return "<{} using backend {}>".format(type(self), type(self._backend))

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """The event loop used by this instance."""
        return self._loop

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop
        self._motion_lock = asyncio.Lock(loop=loop)

    @property
    def is_simulator(self):
        """`True` if this is a simulator; `False` otherwise."""
        return isinstance(self._backend, Simulator)

    def register_callback(self, cb: HardwareEventHandler) -> Callable[[], None]:
        """Allows the caller to register a callback, and returns a closure
        that can be used to unregister the provided callback
        """
        self._callbacks.add(cb)

        def unregister():
            self._callbacks.remove(cb)

        return unregister

    def get_fw_version(self) -> str:
        """
        Return the firmware version of the connected hardware.

        The version is a string retrieved directly from the attached hardware
        (or possibly simulator).
        """
        from_backend = self._backend.fw_version
        if from_backend is None:
            return "unknown"
        else:
            return from_backend

    @property
    def fw_version(self) -> str:
        return self.get_fw_version()

    @property
    def board_revision(self) -> str:
        return str(self._backend.board_revision)

    # Incidentals (i.e. not motion) API

    async def set_lights(self, button: bool = None, rails: bool = None):
        """Control the robot lights.

        :param button: If specified, turn the button light on (`True`) or
                       off (`False`). If not specified, do not change the
                       button light.
        :param rails: If specified, turn the rail lights on (`True`) or
                      off (`False`). If not specified, do not change the
                      rail lights.
        """
        self._backend.set_lights(button, rails)

    def get_lights(self) -> Dict[str, bool]:
        """Return the current status of the robot lights.

        :returns: A dict of the lights: `{'button': bool, 'rails': bool}`
        """
        return self._backend.get_lights()

    async def identify(self, duration_s: int = 5):
        """Blink the button light to identify the robot.

        :param int duration_s: The duration to blink for, in seconds.
        """
        count = duration_s * 4
        on = False
        for sec in range(count):
            then = self._loop.time()
            await self.set_lights(button=on)
            on = not on
            now = self._loop.time()
            await asyncio.sleep(max(0, 0.25 - (now - then)))
        await self.set_lights(button=True)

    @ExecutionManagerProvider.wait_for_running
    async def delay(self, duration_s: float):
        """Delay execution by pausing and sleeping."""
        self.pause(PauseType.DELAY)
        try:
            await self.do_delay(duration_s)
        finally:
            self.resume(PauseType.DELAY)

    @property
    def attached_modules(self) -> List[modules.AbstractModule]:
        return self._backend.module_controls.available_modules

    async def update_firmware(
        self,
        firmware_file: str,
        loop: asyncio.AbstractEventLoop = None,
        explicit_modeset: bool = True,
    ) -> str:
        """Update the firmware on the Smoothie board.

        :param firmware_file: The path to the firmware file.
        :param explicit_modeset: `True` to force the smoothie into programming
                                 mode; `False` to assume it is already in
                                 programming mode.
        :param loop: An asyncio event loop to use; if not specified, the one
                     associated with this instance will be used.
        :returns: The stdout of the tool used to update the smoothie
        """
        if None is loop:
            checked_loop = self._loop
        else:
            checked_loop = loop
        return await self._backend.update_firmware(
            firmware_file, checked_loop, explicit_modeset
        )

    async def cache_instruments(
        self, require: Dict[top_types.Mount, PipetteName] = None
    ):
        """
        Scan the attached instruments, take necessary configuration actions,
        and set up hardware controller internal state if necessary.

        :param require: If specified, the require should be a dict
                        of mounts to instrument names describing
                        the instruments expected to be present. This can
                        save a subsequent of :py:attr:`attached_instruments`
                        and also serves as the hook for the hardware
                        simulator to decide what is attached.
        :raises RuntimeError: If an instrument is expected but not found.

        .. note::

            This function will only change the things that need to be changed.
            If the same pipette (by serial) or the same lack of pipette is
            observed on a mount before and after the scan, no action will be
            taken. That makes this function appropriate for setting up the
            robot for operation, but not for making sure that any previous
            settings changes have been reset. For the latter use case, use
            :py:meth:`reset_instrument`.

        """
        self._log.info("Updating instrument model cache")
        checked_require = require or {}
        for mount, name in checked_require.items():
            if name not in name_config():
                raise RuntimeError(f"{name} is not a valid pipette name")
        async with self._motion_lock:
            found = await self._backend.get_attached_instruments(checked_require)

        for mount, instrument_data in found.items():
            config = instrument_data.get("config")
            req_instr = checked_require.get(mount, None)
            pip_id = instrument_data.get("id")
            pip_offset_cal = load_pipette_offset(pip_id, mount)
            p, may_skip = load_from_config_and_check_skip(
                config,
                self._attached_instruments[mount],
                req_instr,
                pip_id,
                pip_offset_cal,
            )
            self._attached_instruments[mount] = p
            if req_instr and p:
                p.act_as(req_instr)

            if may_skip:
                self._log.info(f"Skipping configuration on {mount.name}")
                continue

            self._log.info(f"Doing full configuration on {mount.name}")
            hw_config = generate_hardware_configs(
                p, self._config, self._backend.board_revision
            )
            await self._backend.configure_mount(mount, hw_config)
        self._log.info("Instruments found: {}".format(self._attached_instruments))

    # Global actions API
    def pause(self, pause_type: PauseType):
        """
        Pause motion of the robot after a current motion concludes.

        Individual calls to :py:meth:`move`
        (which :py:meth:`aspirate` and :py:meth:`dispense` and other
        calls may depend on) are considered atomic and will always complete if
        they have been called prior to a call to this method. However,
        subsequent calls to :py:meth:`move` that occur when the system
        is paused will not proceed until the system is resumed with
        :py:meth:`resume`.
        """
        self._pause_manager.pause(pause_type)

        async def _chained_calls():
            await self._execution_manager.pause()
            self._backend.pause()

        asyncio.run_coroutine_threadsafe(_chained_calls(), self._loop)

    def pause_with_message(self, message: str):
        self._log.warning(f"Pause with message: {message}")
        notification = ErrorMessageNotification(message=message)
        for cb in self._callbacks:
            cb(notification)
        self.pause(PauseType.PAUSE)

    def resume(self, pause_type: PauseType):
        """
        Resume motion after a call to :py:meth:`pause`.
        """
        self._pause_manager.resume(pause_type)

        if self._pause_manager.should_pause:
            return

        # Resume must be called immediately to awaken thread running hardware
        #  methods (ThreadManager)
        self._backend.resume()

        async def _chained_calls():
            # mirror what happens API.pause.
            await self._execution_manager.resume()
            self._backend.resume()

        asyncio.run_coroutine_threadsafe(_chained_calls(), self._loop)

    async def halt(self) -> None:
        """Immediately stop motion.

        Calls to :py:meth:`stop` through the synch adapter while other calls
        are ongoing will typically wait until those calls are done, since most
        of the async calls here in fact block the loop while they talk to
        smoothie. To provide actual immediate halting, call this method which
        does not require use of the loop.

        After this call, the smoothie will be in a bad state until a call to
        :py:meth:`stop`.
        """
        await self._backend.hard_halt()
        asyncio.run_coroutine_threadsafe(self._execution_manager.cancel(), self._loop)

    async def stop(self, home_after: bool = True):
        """
        Stop motion as soon as possible, reset, and optionally home.

        This will cancel motion (after the current call to :py:meth:`move`;
        see :py:meth:`pause` for more detail), then home and reset the
        robot.
        """
        await self._backend.halt()
        self._log.info("Recovering from halt")
        await self.reset()
        await self.cache_instruments()

        if home_after:
            await self.home()

    async def reset(self) -> None:
        """Reset the stored state of the system.

        This will re-scan instruments and models, clearing any cached
        information about their presence or state.
        """
        self._pause_manager.reset()
        await self._execution_manager.reset()
        await InstrumentHandlerProvider.reset(self)

    # Gantry/frame (i.e. not pipette) action API
    async def home_z(self, mount: Optional[top_types.Mount] = None):
        """Home the two z-axes"""
        self._reset_last_mount()
        if not mount:
            axes = [Axis.Z, Axis.A]
        else:
            axes = [Axis.by_mount(mount)]
        await self.home(axes)

    async def _do_plunger_home(
        self,
        axis: Axis = None,
        mount: top_types.Mount = None,
        acquire_lock: bool = True,
    ):
        assert (axis is not None) ^ (mount is not None), "specify either axis or mount"
        if axis:
            checked_axis = axis
            checked_mount = Axis.to_mount(checked_axis)
        if mount:
            checked_mount = mount
            checked_axis = Axis.of_plunger(checked_mount)
        instr = self.hardware_instruments[checked_mount]
        if not instr:
            return
        async with contextlib.AsyncExitStack() as stack:
            if acquire_lock:
                await stack.enter_async_context(self._motion_lock)
            with self._backend.save_current():
                self._backend.set_active_current(
                    {checked_axis: instr.config.plunger_current}
                )
                await self._backend.home([checked_axis.name.upper()])
                # either we were passed False for our acquire_lock and we
                # should pass it on, or we acquired the lock above and
                # shouldn't do it again
                target_pos, _, secondary_z = target_position_from_plunger(
                    checked_mount, (instr.config.bottom,), self._current_position
                )
                await self._move(
                    target_pos,
                    acquire_lock=False,
                    home_flagged_axes=False,
                    secondary_z=secondary_z,
                )

    async def home_plunger(self, mount: top_types.Mount):
        """
        Home the plunger motor for a mount, and then return it to the 'bottom'
        position.

        :param mount: the mount associated with the target plunger
        :type mount: :py:class:`.top_types.Mount`
        """
        await self.current_position(mount=mount, refresh=True)
        await self._do_plunger_home(mount=mount, acquire_lock=True)

    @ExecutionManagerProvider.wait_for_running
    async def home(self, axes: Optional[List[Axis]] = None):
        """Home the entire robot and initialize current position.
        :param axes: A list of axes to home. Default is `None`, which will
                     home everything.
        """
        self._reset_last_mount()
        # Initialize/update current_position
        checked_axes = axes or [ax for ax in Axis]
        gantry = [ax for ax in checked_axes if ax in Axis.gantry_axes()]
        smoothie_gantry = [ax.name.upper() for ax in gantry]
        smoothie_pos = {}
        plungers = [ax for ax in checked_axes if ax not in Axis.gantry_axes()]

        async with self._motion_lock:
            if smoothie_gantry:
                smoothie_pos.update(await self._backend.home(smoothie_gantry))
                self._current_position = self._deck_from_smoothie(smoothie_pos)
            for plunger in plungers:
                await self._do_plunger_home(axis=plunger, acquire_lock=False)

    def _deck_from_smoothie(self, smoothie_pos: Dict[str, float]) -> Dict[Axis, float]:
        """Build a deck-abs position store from the smoothie's position

        This should take the smoothie style position {'X': float, etc}
        and turn it into the position dict used here {Axis.X: float} in
        deck-absolute coordinates. It runs the reverse deck transformation
        for the axes that require it.

        One piece of complexity is that if the gantry transformation includes
        a transition between non parallel planes, the z position of the left
        mount would depend on its actual position in deck frame, so we have
        to apply the mount offset.

        TODO: Figure out which frame the mount offset is measured in, because
              if it's measured in the deck frame (e.g. by touching off points
              on the deck) it has to go through the reverse transform to be
              added to the smoothie coordinates here.
        """
        with_enum = {Axis[k]: v for k, v in smoothie_pos.items()}
        plunger_axes = {
            k: v for k, v in with_enum.items() if k not in Axis.gantry_axes()
        }
        right = (
            with_enum[Axis.X],
            with_enum[Axis.Y],
            with_enum[Axis.by_mount(top_types.Mount.RIGHT)],
        )
        left = (
            with_enum[Axis.X],
            with_enum[Axis.Y],
            with_enum[Axis.by_mount(top_types.Mount.LEFT)],
        )

        gantry_calibration = self.robot_calibration.deck_calibration.attitude
        right_deck = linal.apply_reverse(gantry_calibration, right)
        left_deck = linal.apply_reverse(gantry_calibration, left)
        deck_pos = {
            Axis.X: right_deck[0],
            Axis.Y: right_deck[1],
            Axis.by_mount(top_types.Mount.RIGHT): right_deck[2],
            Axis.by_mount(top_types.Mount.LEFT): left_deck[2],
        }
        deck_pos.update(plunger_axes)
        return deck_pos

    async def current_position(
        self,
        mount: top_types.Mount,
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        # TODO(mc, 2021-11-15): combine with `refresh` for more reliable
        # position reporting when motors are not homed
        fail_on_not_homed: bool = False,
    ) -> Dict[Axis, float]:
        """Return the postion (in deck coords) of the critical point of the
        specified mount.

        This returns cached position to avoid hitting the smoothie driver
        unless ``refresh`` is ``True``.

        If `critical_point` is specified, that critical point will be applied
        instead of the default one. For instance, if
        `critical_point=CriticalPoints.MOUNT` then the position of the mount
        will be returned. If the critical point specified does not exist, then
        the next one down is returned - for instance, if there is no tip on the
        specified mount but `CriticalPoint.TIP` was specified, the position of
        the nozzle will be returned.

        If `fail_on_not_homed` is `True`, this method will raise a `MustHomeError`
        if any of the relavent axes are not homed, regardless of `refresh`.
        """
        z_ax = Axis.by_mount(mount)
        plunger_ax = Axis.of_plunger(mount)
        position_axes = [Axis.X, Axis.Y, z_ax, plunger_ax]

        if fail_on_not_homed and (
            not self._backend.is_homed([str(a) for a in position_axes])
            or not self._current_position
        ):
            raise MustHomeError(
                f"Current position of {str(mount)} pipette is unknown, please home."
            )

        elif not self._current_position and not refresh:
            raise MustHomeError("Current position is unknown; please home motors.")
        async with self._motion_lock:
            if refresh:
                self._current_position = self._deck_from_smoothie(
                    await self._backend.update_position()
                )
            if mount == top_types.Mount.RIGHT:
                offset = top_types.Point(0, 0, 0)
            else:
                offset = top_types.Point(*self._config.left_mount_offset)

            cp = self.critical_point_for(mount, critical_point)
            return {
                Axis.X: self._current_position[Axis.X] + offset[0] + cp.x,
                Axis.Y: self._current_position[Axis.Y] + offset[1] + cp.y,
                z_ax: self._current_position[z_ax] + offset[2] + cp.z,
                plunger_ax: self._current_position[plunger_ax],
            }

    async def gantry_position(
        self,
        mount: top_types.Mount,
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        # TODO(mc, 2021-11-15): combine with `refresh` for more reliable
        # position reporting when motors are not homed
        fail_on_not_homed: bool = False,
    ) -> top_types.Point:
        """Return the position of the critical point as pertains to the gantry

        This ignores the plunger position and gives the Z-axis a predictable
        name (as :py:attr:`.Point.z`).

        `critical_point` specifies an override to the current critical point to
        use (see :py:meth:`current_position`).

        `refresh` if set to True, update the cached position using the
        smoothie driver (see :py:meth:`current_position`).

        If `fail_on_not_homed` is `True`, this method will raise a `MustHomeError`
        if any of the relavent axes are not homed, regardless of `refresh`.
        """
        cur_pos = await self.current_position(
            mount,
            critical_point,
            refresh,
            fail_on_not_homed,
        )
        return top_types.Point(
            x=cur_pos[Axis.X], y=cur_pos[Axis.Y], z=cur_pos[Axis.by_mount(mount)]
        )

    async def move_to(
        self,
        mount: Union[top_types.Mount, PipettePair],
        abs_position: top_types.Point,
        speed: Optional[float] = None,
        critical_point: Optional[CriticalPoint] = None,
        max_speeds: Optional[Dict[Axis, float]] = None,
    ):
        """Move the critical point of the specified mount to a location
        relative to the deck, at the specified speed. 'speed' sets the speed
        of all robot axes to the given value. So, if multiple axes are to be
        moved, they will do so at the same speed

        The critical point of the mount depends on the current status of
        the mount:
        - If the mount does not have anything attached, its critical point is
          the bottom of the mount attach bracket.
        - If the mount has a pipette attached and it is not known to have a
          pipette tip, the critical point is the end of the nozzle of a single
          pipette or the end of the backmost nozzle of a multipipette
        - If the mount has a pipette attached and it is known to have a
          pipette tip, the critical point is the end of the pipette tip for
          a single pipette or the end of the tip of the backmost nozzle of a
          multipipette

        :param mount: The mount to move
        :param abs_position: The target absolute position in
                             deck coordinates to move the
                             critical point to
        :param speed: An overall head speed to use during the move
        :param critical_point: The critical point to move. In most situations
                               this is not needed. If not specified, the
                               current critical point will be moved. If
                               specified, the critical point must be one that
                               actually exists - that is, specifying
                               :py:attr:`.CriticalPoint.NOZZLE` when no pipette
                               is attached or :py:attr:`.CriticalPoint.TIP`
                               when no tip is applied will result in an error.
        :param max_speeds: An optional override for per-axis maximum speeds. If
                           an axis is specified, it will not move faster than
                           the given speed. Note that this does not make that
                           axis move precisely at the given speed; it only
                           it if it was going to go faster. Direct speed
                           is still set by ``speed``.
        """
        if not self._current_position:
            await self.home()

        target_position, primary_mount, secondary_z = target_position_from_absolute(
            mount,
            abs_position,
            partial(self.critical_point_for, cp_override=critical_point),
            top_types.Point(*self._config.left_mount_offset),
        )

        await self._cache_and_maybe_retract_mount(primary_mount)
        await self._move(
            target_position, speed=speed, max_speeds=max_speeds, secondary_z=secondary_z
        )

    async def move_rel(
        self,
        mount: Union[top_types.Mount, PipettePair],
        delta: top_types.Point,
        speed: Optional[float] = None,
        max_speeds: Optional[Dict[Axis, float]] = None,
        check_bounds: MotionChecks = MotionChecks.NONE,
        fail_on_not_homed: bool = False,
    ):
        """Move the critical point of the specified mount by a specified
        displacement in a specified direction, at the specified speed.
        'speed' sets the speed of all axes to the given value. So, if multiple
        axes are to be moved, they will do so at the same speed.

        If fail_on_not_homed is True (default False), if an axis that is not
        homed moves it will raise a MustHomeError. Otherwise, it will home the axis.
        """

        # TODO: Remove the fail_on_not_homed and make this the behavior all the time.
        # Having the optional arg makes the bug stick around in existing code and we
        # really want to fix it when we're not gearing up for a release.
        mhe = MustHomeError(
            "Cannot make a relative move because absolute position is unknown"
        )
        if not self._current_position:
            if fail_on_not_homed:
                raise mhe
            else:
                await self.home()

        target_position, primary_mount, secondary_z = target_position_from_relative(
            mount, delta, self._current_position
        )
        axes_moving = [Axis.X, Axis.Y, Axis.by_mount(primary_mount), secondary_z]
        if fail_on_not_homed and not self._backend.is_homed(
            [axis.name for axis in axes_moving if axis is not None]
        ):
            raise mhe
        await self._cache_and_maybe_retract_mount(primary_mount)
        await self._move(
            target_position,
            speed=speed,
            max_speeds=max_speeds,
            secondary_z=secondary_z,
            check_bounds=check_bounds,
        )

    async def _cache_and_maybe_retract_mount(self, mount: top_types.Mount):
        """Retract the 'other' mount if necessary

        If `mount` does not match the value in :py:attr:`_last_moved_mount`
        (and :py:attr:`_last_moved_mount` exists) then retract the mount
        in :py:attr:`_last_moved_mount`. Also unconditionally update
        :py:attr:`_last_moved_mount` to contain `mount`.
        """
        if mount != self._last_moved_mount and self._last_moved_mount:
            await self.retract(self._last_moved_mount, 10)
        self._last_moved_mount = mount

    def _get_transformed(
        self,
        to_transform_primary: Tuple[float, ...],
        to_transform_secondary: Tuple[float, ...],
    ) -> Tuple[Tuple, Tuple]:
        # Type ignored below because linal.apply_transform (rightly) specifies
        # Tuple[float, float, float] and the implied type from
        # target_position.items() is (rightly) Tuple[float, ...] with unbounded
        # size; unfortunately, mypy can’t quite figure out the length check
        # above that makes this OK
        primary_transformed = linal.apply_transform(
            self.robot_calibration.deck_calibration.attitude,
            to_transform_primary,  # type: ignore[arg-type]
        )
        secondary_transformed = linal.apply_transform(
            self.robot_calibration.deck_calibration.attitude,
            to_transform_secondary,  # type: ignore[arg-type]
        )
        return primary_transformed, secondary_transformed

    @ExecutionManagerProvider.wait_for_running
    async def _move(
        self,
        target_position: "OrderedDict[Axis, float]",
        speed: float = None,
        home_flagged_axes: bool = True,
        max_speeds: Dict[Axis, float] = None,
        acquire_lock: bool = True,
        secondary_z: Axis = None,
        check_bounds: MotionChecks = MotionChecks.NONE,
    ):
        """Worker function to apply robot motion.

        Robot motion means the kind of motions that are relevant to the robot,
        i.e. only one pipette plunger and mount move at the same time, and an
        XYZ move in the coordinate frame of one of the pipettes.

        ``target_position`` should be an ordered dict (ordered by XYZABC)
        of deck calibrated values, containing any specified XY motion and
        at most one of a ZA or BC components. The frame in which to move
        is identified by the presence of (ZA) or (BC).
        """
        # Transform only the x, y, and (z or a) axes specified since this could
        # get the b or c axes as well
        to_transform_primary = tuple(
            (
                tp
                for ax, tp in target_position.items()
                if (ax in Axis.gantry_axes() and ax != secondary_z)
            )
        )
        if secondary_z:
            to_transform_secondary = tuple((0, 0, target_position[secondary_z]))
        else:
            to_transform_secondary = tuple((0, 0, 0))
        # Pre-fill the dict we’ll send to the backend with the axes we don’t
        # need to transform
        smoothie_pos = {
            ax.name: pos
            for ax, pos in target_position.items()
            if ax not in Axis.gantry_axes()
        }
        if len(to_transform_primary) != 3:
            self._log.error(
                "Move derived {} axes to transform from {}".format(
                    len(to_transform_primary), target_position
                )
            )
            raise ValueError(
                "Moves must specify either exactly an "
                "x, y, and (z or a) or none of them"
            )
        primary_transformed, secondary_transformed = self._get_transformed(
            to_transform_primary, to_transform_secondary
        )
        transformed = (*primary_transformed, secondary_transformed[2])
        # Since target_position is an OrderedDict with the axes ordered by
        # (x, y, z, a, b, c), and we’ll only have one of a or z (as checked
        # by the len(to_transform) check above) we can use an enumerate to
        # fuse the specified axes and the transformed values back together.
        # While we do this iteration, we’ll also check axis bounds.
        bounds = self._backend.axis_bounds
        to_check = {
            ax: transformed[idx]
            for idx, ax in enumerate(target_position.keys())
            if ax in Axis.gantry_axes()
        }
        check_motion_bounds(to_check, target_position, bounds, check_bounds)
        smoothie_pos.update({ax.name: pos for ax, pos in to_check.items()})
        checked_maxes = max_speeds or {}
        str_maxes = {ax.name: val for ax, val in checked_maxes.items()}
        async with contextlib.AsyncExitStack() as stack:
            if acquire_lock:
                await stack.enter_async_context(self._motion_lock)
            try:
                await self._backend.move(
                    smoothie_pos,
                    speed=speed,
                    home_flagged_axes=home_flagged_axes,
                    axis_max_speeds=str_maxes,
                )
            except Exception:
                self._log.exception("Move failed")
                self._current_position.clear()
                raise
            else:
                self._current_position.update(target_position)

    def get_engaged_axes(self) -> Dict[Axis, bool]:
        """Which axes are engaged and holding."""
        return {Axis[ax]: eng for ax, eng in self._backend.engaged_axes().items()}

    @property
    def engaged_axes(self):
        return self.get_engaged_axes()

    async def disengage_axes(self, which: List[Axis]):
        await self._backend.disengage_axes([ax.name for ax in which])

    async def _fast_home(self, axes: Sequence[str], margin: float) -> Dict[str, float]:
        converted_axes = "".join(axes)
        return await self._backend.fast_home(converted_axes, margin)

    @ExecutionManagerProvider.wait_for_running
    async def retract(
        self, mount: Union[top_types.Mount, PipettePair], margin: float = 10
    ):
        """Pull the specified mount up to its home position.

        Works regardless of critical point or home status.
        """
        if isinstance(mount, PipettePair):
            primary_ax = Axis.by_mount(mount.primary).name.upper()
            secondary_ax = Axis.by_mount(mount.secondary).name.upper()
            smoothie_ax: Tuple[str, ...] = (primary_ax, secondary_ax)
        else:
            smoothie_ax = (Axis.by_mount(mount).name.upper(),)

        async with self._motion_lock:
            smoothie_pos = await self._fast_home(smoothie_ax, margin)
            self._current_position = self._deck_from_smoothie(smoothie_pos)

    # Gantry/frame (i.e. not pipette) config API
    @property
    def config(self) -> RobotConfig:
        """Get the robot's configuration object.

        :returns .RobotConfig: The object.
        """
        return self._config

    @config.setter
    def config(self, config: RobotConfig) -> None:
        """Replace the currently-loaded config"""
        self._config = config

    def get_config(self) -> RobotConfig:
        """
        Get the robot's configuration object.

        :returns .RobotConfig: The object.
        """
        return self.config

    def set_config(self, config: RobotConfig) -> None:
        """Replace the currently-loaded config"""
        self.config = config

    async def update_config(self, **kwargs):
        """Update values of the robot's configuration.

        `kwargs` should contain keys of the robot's configuration. For
        instance, `update_config(log_level='debug)` would change the API
        server log level to :py:attr:`logging.DEBUG`.

        Documentation on keys can be found in the documentation for
        :py:class:`.RobotConfig`.
        """
        self._config = replace(self._config, **kwargs)

    async def update_deck_calibration(self, new_transform):
        pass

    # Pipette action API
    async def prepare_for_aspirate(
        self, mount: Union[top_types.Mount, PipettePair], rate: float = 1.0
    ):
        """
        Prepare the pipette for aspiration.

        This must happen after every :py:meth:`blow_out` and should probably be
        called before every :py:meth:`aspirate`, while the pipette tip is not
        immersed in a well. It ensures that the plunger is at the 0-volume
        position of the pipette if necessary (if not necessary, it does
        nothing).

        If :py:meth:`aspirate` is called immediately after :py:meth:`blow_out`,
        the plunger is left at the ``blow_out`` position, below the ``bottom``
        position, and moving the plunger up during :py:meth:`aspirate` is
        expected to aspirate liquid - :py:meth:`aspirate` is called once the
        pipette tip is already in the well. This will cause a subtle over
        aspiration. To make the problem more obvious, :py:meth:`aspirate` will
        raise an exception if this method has not previously been called.
        """
        instruments = self.instruments_for(mount)
        self.ready_for_tip_action(instruments, HardwareAction.PREPARE_ASPIRATE)

        with_zero = filter(lambda i: i[0].current_volume == 0, instruments)
        for instr in with_zero:
            speed = self.plunger_speed(
                instr[0], instr[0].blow_out_flow_rate, "aspirate"
            )
            bottom = (instr[0].config.bottom,)
            target, _, secondary_z = target_position_from_plunger(
                instr[1], bottom, self._current_position
            )
            await self._move(
                target,
                speed=(speed * rate),
                secondary_z=secondary_z,
                home_flagged_axes=False,
            )
            instr[0].ready_to_aspirate = True

    async def aspirate(
        self,
        mount: Union[top_types.Mount, PipettePair],
        volume: Optional[float] = None,
        rate: float = 1.0,
    ):
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette
        from the *current location*. If no volume is passed, `aspirate` will
        default to max available volume (after taking into account the volume
        already present in the tip).

        The function :py:meth:`prepare_for_aspirate` must be called prior to
        calling this function, while the tip is above the well. This ensures
        that the pipette tip is in the proper position at the bottom of the
        pipette to begin aspiration, and prevents subtle over-aspiration if
        an aspirate is done immediately after :py:meth:`blow_out`. If
        :py:meth:`prepare_for_aspirate` has not been called since the last
        call to :py:meth:`aspirate`, an exception will be raised.

        mount : Mount.LEFT or Mount.RIGHT
        volume : [float] The number of microliters to aspirate
        rate : [float] Set plunger speed for this aspirate, where
            speed = rate * aspirate_speed
        """
        aspirate_spec = self.plan_check_aspirate(mount, volume, rate)
        target_pos, _, secondary_z = target_position_from_plunger(
            mount,
            [spec.plunger_distance for spec in aspirate_spec],
            self._current_position,
        )
        try:
            self._backend.set_active_current(
                {spec.axis: spec.current for spec in aspirate_spec}
            )
            await self._move(
                target_pos,
                speed=aspirate_spec[0].speed,
                secondary_z=secondary_z,
                home_flagged_axes=False,
            )
        except Exception:
            self._log.exception("Aspirate failed")
            for spec in aspirate_spec:
                spec.instr.set_current_volume(0)
            raise
        else:
            for spec in aspirate_spec:
                spec.instr.add_current_volume(spec.volume)

    async def dispense(
        self,
        mount: Union[top_types.Mount, PipettePair],
        volume: Optional[float] = None,
        rate: float = 1.0,
    ):
        """
        Dispense a volume of liquid in microliters(uL) using this pipette
        at the current location. If no volume is specified, `dispense` will
        dispense all volume currently present in pipette

        mount : Mount.LEFT or Mount.RIGHT
        volume : [float] The number of microliters to dispense
        rate : [float] Set plunger speed for this dispense, where
            speed = rate * dispense_speed
        """
        instruments = self.instruments_for(mount)
        self.ready_for_tip_action(instruments, HardwareAction.DISPENSE)

        plunger_currents = {
            Axis.of_plunger(instr[1]): instr[0].config.plunger_current
            for instr in instruments
        }
        if volume is None:
            disp_vol = tuple(instr[0].current_volume for instr in instruments)
            mod_log.debug(
                "No dispense volume specified. Dispensing all "
                "remaining liquid ({}uL) from pipette".format(disp_vol)
            )
        else:
            disp_vol = tuple(volume for instr in instruments)

        # Ensure we don't dispense more than the current volume
        disp_vol = tuple(
            min(instr[0].current_volume, vol)
            for instr, vol in zip(instruments, disp_vol)
        )

        if all([vol == 0 for vol in disp_vol]):
            return
        elif 0 in disp_vol:
            raise PairedPipetteConfigValueError("Cannot only dispense from one pipette")

        dist = tuple(
            self.plunger_position(instr[0], instr[0].current_volume - vol, "dispense")
            for instr, vol in zip(instruments, disp_vol)
        )
        speed = min(
            self.plunger_speed(instr[0], instr[0].dispense_flow_rate * rate, "dispense")
            for instr in instruments
        )

        try:
            self._backend.set_active_current(plunger_currents)
            target_pos, _, secondary_z = target_position_from_plunger(
                mount, dist, self._current_position
            )
            await self._move(
                target_pos,
                speed=speed,
                secondary_z=secondary_z,
                home_flagged_axes=False,
            )
        except Exception:
            self._log.exception("Dispense failed")
            for instr in instruments:
                instr[0].set_current_volume(0)
            raise
        else:
            for instr, vol in zip(instruments, disp_vol):
                instr[0].remove_current_volume(vol)

    async def blow_out(self, mount: Union[top_types.Mount, PipettePair]):
        """
        Force any remaining liquid to dispense. The liquid will be dispensed at
        the current location of pipette
        """
        instruments = self.instruments_for(mount)
        self.ready_for_tip_action(instruments, HardwareAction.BLOWOUT)
        plunger_currents = {
            Axis.of_plunger(instr[1]): instr[0].config.plunger_current
            for instr in instruments
        }
        blow_out = tuple(instr[0].config.blow_out for instr in instruments)

        self._backend.set_active_current(plunger_currents)
        speed = max(
            self.plunger_speed(instr[0], instr[0].blow_out_flow_rate, "dispense")
            for instr in instruments
        )
        try:
            target_pos, _, secondary_z = target_position_from_plunger(
                mount, blow_out, self._current_position
            )
            await self._move(
                target_pos,
                speed=speed,
                secondary_z=secondary_z,
                home_flagged_axes=False,
            )
        except Exception:
            self._log.exception("Blow out failed")
            raise
        finally:
            for instr in instruments:
                instr[0].set_current_volume(0)
                instr[0].ready_to_aspirate = False

    async def pick_up_tip(
        self,
        mount: Union[top_types.Mount, PipettePair],
        tip_length: float,
        presses: Optional[int] = None,
        increment: Optional[float] = None,
    ):
        """
        Pick up tip from current location.

        This is achieved by attempting to move the instrument down by its
        `pick_up_distance`, in a series of presses. This distance is larger
        than the space available in the tip, so the stepper motor will
        eventually skip steps, which is resolved by homing afterwards. The
        pick up operation is done at a current specified in the pipette config,
        which is experimentally determined to skip steps at a level of force
        sufficient to provide a good seal between the pipette nozzle and tip
        while also avoiding attaching the tip so firmly that it can't be
        dropped later.

        If ``presses`` or ``increment`` is not specified (or is ``None``),
        their value is taken from the pipette configuration.
        """
        instruments = self.instruments_for(mount)
        self.ready_for_pick_up_tip(instruments)
        plunger_currents = {
            Axis.of_plunger(instr[1]): instr[0].config.plunger_current
            for instr in instruments
        }
        z_axis_currents = {
            Axis.by_mount(instr[1]): instr[0].config.pick_up_current
            for instr in instruments
        }

        self._backend.set_active_current(plunger_currents)
        # Initialize plunger to bottom position
        bottom_positions = tuple(instr[0].config.bottom for instr in instruments)
        target_absolute, _, secondary_z = target_position_from_plunger(
            mount, bottom_positions, self._current_position
        )
        await self._move(
            target_absolute,
            secondary_z=secondary_z,
            home_flagged_axes=False,
        )

        if not presses or presses < 0:
            all_presses = tuple(
                instr[0].config.pick_up_presses for instr in instruments
            )
            if len(all_presses) > 1 and all_presses[0] != all_presses[1]:
                raise PairedPipetteConfigValueError(
                    "Number of pipette pickups must match"
                )
            checked_presses = all_presses[0]
        else:
            checked_presses = presses

        if not increment or increment < 0:
            check_incr = tuple(
                instr[0].config.pick_up_increment for instr in instruments
            )
        else:
            check_incr = tuple(increment for instr in instruments)

        pick_up_speed = min(instr[0].config.pick_up_speed for instr in instruments)
        # Press the nozzle into the tip <presses> number of times,
        # moving further by <increment> mm after each press
        for i in range(checked_presses):
            # move nozzle down into the tip
            with self._backend.save_current():
                self._backend.set_active_current(z_axis_currents)
                dist = tuple(
                    -1.0 * instr[0].config.pick_up_distance + -1.0 * incrt * i
                    for instr, incrt in zip(instruments, check_incr)
                )
                target_pos = (0, 0, *dist)
                (
                    target_absolute,
                    primary_mount,
                    secondary_z,
                ) = target_position_from_relative(
                    mount, target_pos, self._current_position
                )
                await self._move(
                    target_absolute, speed=pick_up_speed, secondary_z=secondary_z
                )

            # move nozzle back up
            backup_pos = (0, 0, *tuple(-d for d in dist))
            target_absolute, primary_mount, secondary_z = target_position_from_relative(
                mount, backup_pos, self._current_position
            )
            await self._move(
                target_absolute, speed=pick_up_speed, secondary_z=secondary_z
            )
        for instr in instruments:
            instr[0].add_tip(tip_length=tip_length)
            instr[0].set_current_volume(0)

        # neighboring tips tend to get stuck in the space between
        # the volume chamber and the drop-tip sleeve on p1000.
        # This extra shake ensures those tips are removed
        if any(["pickupTipShake" in instr[0].config.quirks for instr in instruments]):
            await self._shake_off_tips_pick_up(mount)
            await self._shake_off_tips_pick_up(mount)

        # Here we add in the debounce distance for the switch as
        # a safety precaution
        retract_target = max(
            instr[0].config.pick_up_distance + incrt * checked_presses + 2
            for instr, incrt in zip(instruments, check_incr)
        )

        await self.retract(mount, retract_target)

    async def drop_tip(
        self, mount: Union[top_types.Mount, PipettePair], home_after=True
    ):
        """
        Drop tip at the current location

        :param Mount mount: The mount to drop a tip from
        :param bool home_after: Home the plunger motor after dropping tip. This
                                is used in case the plunger motor skipped while
                                dropping the tip, and is also used to recover
                                the ejector shroud after a drop.
        """

        instruments = self.instruments_for(mount)
        self.ready_for_tip_action(instruments, HardwareAction.DROPTIP)
        plunger_currents = {
            Axis.of_plunger(instr[1]): instr[0].config.plunger_current
            for instr in instruments
        }
        drop_tip_currents = {
            Axis.of_plunger(instr[1]): instr[0].config.drop_tip_current
            for instr in instruments
        }
        plunger_axes = tuple(
            Axis.of_plunger(instr[1]).name.upper() for instr in instruments
        )

        bottom = tuple(instr[0].config.bottom for instr in instruments)
        droptip = tuple(instr[0].config.drop_tip for instr in instruments)
        speed = min(instr[0].config.drop_tip_speed for instr in instruments)

        async def _drop_tip():
            self._backend.set_active_current(plunger_currents)
            target_pos, _, secondary_z = target_position_from_plunger(
                mount, bottom, self._current_position
            )
            await self._move(
                target_pos,
                secondary_z=secondary_z,
                home_flagged_axes=False,
            )
            self._backend.set_active_current(drop_tip_currents)
            target_pos, _, secondary_z = target_position_from_plunger(
                mount,
                droptip,
                self._current_position,
            )
            await self._move(
                target_pos,
                speed=speed,
                secondary_z=secondary_z,
                home_flagged_axes=False,
            )
            if home_after:
                safety_margin = abs(max(bottom) - max(droptip))
                smoothie_pos = await self._backend.fast_home(
                    plunger_axes, safety_margin
                )
                self._current_position = self._deck_from_smoothie(smoothie_pos)
                self._backend.set_active_current(plunger_currents)
                target_pos, _, secondary_z = target_position_from_plunger(
                    mount, bottom, self._current_position
                )
                await self._move(
                    target_pos,
                    secondary_z=secondary_z,
                    home_flagged_axes=False,
                )

        if any(["doubleDropTip" in instr[0].config.quirks for instr in instruments]):
            await _drop_tip()
        await _drop_tip()

        if any(["dropTipShake" in instr[0].config.quirks for instr in instruments]):
            diameter = min(instr[0].current_tiprack_diameter for instr in instruments)
            await self._shake_off_tips_drop(mount, diameter)
        self._backend.set_active_current(plunger_currents)
        for instr in instruments:
            instr[0].set_current_volume(0)
            instr[0].current_tiprack_diameter = 0.0
            instr[0].remove_tip()

    async def _shake_off_tips_drop(self, mount, tiprack_diameter):
        # tips don't always fall off, especially if resting against
        # tiprack or other tips below it. To ensure the tip has fallen
        # first, shake the pipette to dislodge partially-sealed tips,
        # then second, raise the pipette so loosened tips have room to fall
        shake_off_dist = SHAKE_OFF_TIPS_DROP_DISTANCE
        if tiprack_diameter > 0.0:
            shake_off_dist = min(shake_off_dist, tiprack_diameter / 4)
        shake_off_dist = max(shake_off_dist, 1.0)

        shake_pos = top_types.Point(-shake_off_dist, 0, 0)  # move left
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(2 * shake_off_dist, 0, 0)  # move right
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(-shake_off_dist, 0, 0)  # original position
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        # raise the pipette upwards so we are sure tip has fallen off
        up_pos = top_types.Point(0, 0, DROP_TIP_RELEASE_DISTANCE)
        await self.move_rel(mount, up_pos)

    async def _shake_off_tips_pick_up(self, mount: Union[top_types.Mount, PipettePair]):
        # tips don't always fall off, especially if resting against
        # tiprack or other tips below it. To ensure the tip has fallen
        # first, shake the pipette to dislodge partially-sealed tips,
        # then second, raise the pipette so loosened tips have room to fall
        shake_off_dist = SHAKE_OFF_TIPS_PICKUP_DISTANCE

        shake_pos = top_types.Point(-shake_off_dist, 0, 0)  # move left
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(2 * shake_off_dist, 0, 0)  # move right
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(-shake_off_dist, 0, 0)  # original position
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(0, -shake_off_dist, 0)  # move front
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(0, 2 * shake_off_dist, 0)  # move back
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(0, -shake_off_dist, 0)  # original position
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        # raise the pipette upwards so we are sure tip has fallen off
        up_pos = top_types.Point(0, 0, DROP_TIP_RELEASE_DISTANCE)
        await self.move_rel(mount, up_pos)

    async def find_modules(
        self,
        by_model: modules.types.ModuleModel,
        resolved_type: modules.types.ModuleType,
    ) -> Tuple[List[modules.AbstractModule], Optional[modules.AbstractModule]]:
        modules_result = await self._backend.module_controls.parse_modules(
            by_model, resolved_type
        )
        return modules_result

    def get_instrument_max_height(
        self, mount: top_types.Mount, critical_point: Optional[CriticalPoint] = None
    ) -> float:
        return InstrumentHandlerProvider.instrument_max_height(
            self, mount, self._config.z_retract_distance, critical_point
        )

    def clean_up(self) -> None:
        """Get the API ready to stop cleanly."""
        self._backend.clean_up()
