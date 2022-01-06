"""Provides a base class for hardware controllers."""
import asyncio
from typing import Callable, Dict, List, Optional, Union, Tuple
from .types import (
    HardwareEventHandler,
    Axis,
    CriticalPoint,
    PipettePair,
    MotionChecks,
    DoorState,
    PauseType,
)
from .modules import AbstractModule
from .modules.types import ModuleModel, ModuleType
from opentrons.types import Mount, Point
from opentrons.config.types import RobotConfig
from .util import DeckTransformState
from .robot_calibration import RobotCalibration
from typing_extensions import Protocol

from opentrons_shared_data.pipette.dev_types import PipetteName
from .dev_types import PipetteDict


class ModuleProvider(Protocol):
    """A protocol specifying access to modules."""

    @property
    def attached_modules(self) -> List[AbstractModule]:
        """Return a list of currently-attached modules."""
        ...

    async def find_modules(
        self,
        by_model: ModuleModel,
        resolved_type: ModuleType,
    ) -> Tuple[List[AbstractModule], Optional[AbstractModule]]:
        """Query the attached modules for a specific kind or model of module."""
        ...


class ExecutionControllable(Protocol):
    """A protocol specifying run control (pause, resume)."""

    def pause(self, pause_type: PauseType) -> None:
        """
        Pause motion of the robot after a current motion concludes.

        Individual calls to move
        (which aspirate and dispense and other calls may depend on) are
        considered atomic and will always complete if they have been called
        prior to a call to this method. However, subsequent calls to move that
        occur when the system is paused will not proceed until the system is
        resumed with resume.
        """
        ...

    def pause_with_message(self, message: str) -> None:
        """Pause motion of the robot as with pause, but specify a message."""
        ...

    def resume(self, pause_type: PauseType) -> None:
        """
        Resume motion after a call to pause.
        """
        ...

    async def delay(self, duration_s: float):
        """Delay execution by pausing and sleeping."""
        ...


class InstrumentConfigurer(Protocol):
    """A protocol specifying how to interact with instrument presence and detection."""

    def reset_instrument(self, mount: Mount = None) -> None:
        """
        Reset the internal state of a pipette by its mount, without doing
        any lower level reconfiguration. This is useful to make sure that no
        settings changes from a protocol persist.

        mount: If specified, reset that mount. If not specified, reset both
        """
        ...

    async def cache_instruments(
        self, require: Dict[Mount, "PipetteName"] = None
    ) -> None:
        """
        Scan the attached instruments, take necessary configuration actions,
        and set up hardware controller internal state if necessary.

        require: If specified, the require should be a dict of mounts to
                 instrument names describing the instruments expected to be
                 present. This can save a subsequent call of attached_instruments
                 and also serves as the hook for the hardware simulator to decide
                 what is attached.
        raises RuntimeError: If an instrument is expected but not found.

        This function will only change the things that need to be changed.
        If the same pipette (by serial) or the same lack of pipette is
        observed on a mount before and after the scan, no action will be
        taken. That makes this function appropriate for setting up the
        robot for operation, but not for making sure that any previous
        settings changes have been reset. For the latter use case, use
        reset_instrument.
        """
        ...

    def get_attached_instruments(self) -> Dict[Mount, PipetteDict]:
        """Get the status dicts of the cached attached instruments.

        Also available as :py:meth:`get_attached_instruments`.

        This returns a dictified version of the
        hardware_control.pipette.Pipette as a dict keyed by
        the Mount to which the pipette is attached.
        If no pipette is attached on a given mount, the mount key will
        still be present but will have the value ``None``.

        Note that on the OT-2 this is only a query of a cached value;
        to actively scan for changes, use cache_instruments`. This process
        deactivates the OT-2's motors and should be used sparingly.
        """
        ...

    def get_attached_instrument(self, mount: Mount) -> PipetteDict:
        """Get the status dict of a single cached instrument.

        Return values and caveats are as get_attached_instruments.
        """
        ...

    @property
    def attached_instruments(self) -> Dict[Mount, PipetteDict]:
        return self.get_attached_instruments()

    def calibrate_plunger(
        self,
        mount: Mount,
        top: float = None,
        bottom: float = None,
        blow_out: float = None,
        drop_tip: float = None,
    ):
        """
        Set calibration values for the pipette plunger.
        This can be called multiple times as the user sets each value,
        or you can set them all at once.
        :param top: Touching but not engaging the plunger.
        :param bottom: Must be above the pipette's physical hard-stop, while
        still leaving enough room for 'blow_out'
        :param blow_out: Plunger is pushed down enough to expel all liquids.
        :param drop_tip: Position that causes the tip to be released from the
        pipette
        """
        ...

    def set_flow_rate(
        self,
        mount: Mount,
        aspirate: float = None,
        dispense: float = None,
        blow_out: float = None,
    ) -> None:
        """Set a pipette's rate of liquid handling in flow rate units"""
        ...

    def set_pipette_speed(
        self,
        mount: Mount,
        aspirate: float = None,
        dispense: float = None,
        blow_out: float = None,
    ) -> None:
        """Set a pipette's rate of liquid handling in linear speed units."""
        ...

    def get_instrument_max_height(
        self, mount: Mount, critical_point: CriticalPoint = None
    ) -> float:
        """Return max achievable height of the attached instrument
        based on the current critical point
        """
        ...

    async def add_tip(self, mount: Mount, tip_length: float) -> None:
        """Inform the hardware that a tip is now attached to a pipette.

        This changes the critical point of the pipette to make sure that
        the end of the tip is what moves around, and allows liquid handling.
        """
        ...

    async def remove_tip(self, mount: Mount) -> None:
        """Inform the hardware that a tip is no longer attached to a pipette.

        This changes the critical point of the system to the end of the
        nozzle and prevents further liquid handling commands.
        """
        ...

    def set_current_tiprack_diameter(
        self, mount: Union[Mount, PipettePair], tiprack_diameter: float
    ) -> None:
        """Inform the hardware of the diameter of the tiprack.

        This drives the magnitude of the shake commanded for pipettes that need
        a shake after dropping or picking up tips.
        """
        ...

    def set_working_volume(
        self, mount: Union[Mount, PipettePair], tip_volume: int
    ) -> None:
        """Inform the hardware how much volume a pipette can aspirate.

        This will set the limit of aspiration for the pipette, and is
        necessary for backcompatibility.
        """
        ...


class MotionController(Protocol):
    """Protocol specifying fundamental motion controls."""

    async def halt(self) -> None:
        """Immediately stop motion.

        Calls to stop through the synch adapter while other calls
        are ongoing will typically wait until those calls are done, since most
        of the async calls here in fact block the loop while they talk to
        smoothie. To provide actual immediate halting, call this method which
        does not require use of the loop.

        After this call, the hardware will be in a bad state until a call to
        stop
        """
        ...

    async def stop(self, home_after: bool = True) -> None:
        """
        Stop motion as soon as possible, reset, and optionally home.

        This will cancel motion (after the current call to :py:meth:`move`;
        see :py:meth:`pause` for more detail), then home and reset the
        robot.
        """
        ...

    async def reset(self) -> None:
        """Reset the stored state of the system.

        This will re-scan instruments and models, clearing any cached
        information about their presence or state.
        """
        ...

    # Gantry/frame (i.e. not pipette) action API
    async def home_z(self, mount: Mount = None) -> None:
        """Home a selected z-axis, or both if not specified."""
        ...

    async def home_plunger(self, mount: Mount) -> None:
        """
        Home the plunger motor for a mount, and then return it to the 'bottom'
        position.

        mount: the mount associated with the target plunger
        """
        ...

    async def home(self, axes: List[Axis] = None) -> None:
        """Home a list of axes and initialize current position.

        axes A list of axes to home. Default is `None`, which will
             home everything.
        """
        ...

    async def current_position(
        self,
        mount: Mount,
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
        ...

    async def gantry_position(
        self,
        mount: Mount,
        critical_point: CriticalPoint = None,
        refresh: bool = False,
        # TODO(mc, 2021-11-15): combine with `refresh` for more reliable
        # position reporting when motors are not homed
        fail_on_not_homed: bool = False,
    ) -> Point:
        """Retrieve the position of just the currently-active pipette.

        While current_position returns the position of every actuator on the system,
        this function just returns the x, y, and z of the critical point of whichever
        pipette is currently active (last moved).
        """
        ...

    async def move_to(
        self,
        mount: Union[Mount, PipettePair],
        abs_position: Point,
        speed: float = None,
        critical_point: CriticalPoint = None,
        max_speeds: Dict[Axis, float] = None,
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
        ...

    async def move_rel(
        self,
        mount: Union[Mount, PipettePair],
        delta: Point,
        speed: float = None,
        max_speeds: Dict[Axis, float] = None,
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
        ...

    def get_engaged_axes(self) -> Dict[Axis, bool]:
        """Which axes are engaged and holding."""
        ...

    @property
    def engaged_axes(self) -> Dict[Axis, bool]:
        """Which axes are engaged and holding"""
        return self.get_engaged_axes()

    async def disengage_axes(self, which: List[Axis]) -> None:
        """Disengage some axes."""
        ...

    async def retract(
        self, mount: Union[Mount, PipettePair], margin: float = 10
    ) -> None:
        """Pull the specified mount up to its home position.

        Works regardless of critical point or home status.
        """
        ...


class Configurable(Protocol):
    """Protocol specifying hardware control configuration."""

    def get_config(self) -> RobotConfig:
        """Get the robot's configuration object.

        :returns .RobotConfig: The object.
        """
        ...

    def set_config(self, config: RobotConfig):
        """Replace the currently-loaded config"""
        ...

    @property
    def config(self) -> RobotConfig:
        ...

    @config.setter
    def config(self, config: RobotConfig) -> None:
        ...

    async def update_config(self, **kwargs) -> None:
        """Update values of the robot's configuration.

        `kwargs` should contain keys of the robot's configuration. For
        instance, `update_config(log_level='debug)` would change the API
        server log level to :py:attr:`logging.DEBUG`.

        Documentation on keys can be found in the documentation for
        :py:class:`.RobotConfig`.
        """
        ...


class Calibratable(Protocol):
    """Protocol specifying calibration information"""

    @property
    def robot_calibration(self) -> RobotCalibration:
        """The currently-active robot calibration of the machine."""
        ...

    def reset_robot_calibration(self) -> None:
        """Reset the active robot calibration to the machine default.

        This may be an identity on some machines but not on others; this
        method is therefore preferred to using set_robot_calibration() with a
        caller-constructed identity.
        """
        ...

    def set_robot_calibration(self, robot_calibration: RobotCalibration) -> None:
        """Set the current robot calibration from stored data."""
        ...

    def validate_calibration(self) -> DeckTransformState:
        """Check whether the current calibration is valid."""
        ...


class LiquidHandler(
    InstrumentConfigurer,
    MotionController,
    Configurable,
    Calibratable,
    Protocol,
):
    async def prepare_for_aspirate(
        self, mount: Union[Mount, PipettePair], rate: float = 1.0
    ) -> None:
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
        ...

    async def aspirate(
        self,
        mount: Union[Mount, PipettePair],
        volume: float = None,
        rate: float = 1.0,
    ) -> None:
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
        ...

    async def dispense(
        self,
        mount: Union[Mount, PipettePair],
        volume: float = None,
        rate: float = 1.0,
    ) -> None:
        """
        Dispense a volume of liquid in microliters(uL) using this pipette
        at the current location. If no volume is specified, `dispense` will
        dispense all volume currently present in pipette

        mount : Mount.LEFT or Mount.RIGHT
        volume : [float] The number of microliters to dispense
        rate : [float] Set plunger speed for this dispense, where
            speed = rate * dispense_speed
        """
        ...

    async def blow_out(self, mount: Union[Mount, PipettePair]) -> None:
        """
        Force any remaining liquid to dispense. The liquid will be dispensed at
        the current location of pipette
        """
        ...

    async def pick_up_tip(
        self,
        mount: Union[Mount, PipettePair],
        tip_length: float,
        presses: int = None,
        increment: float = None,
    ) -> None:
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
        ...

    async def drop_tip(self, mount: Union[Mount, PipettePair], home_after=True) -> None:
        """
        Drop tip at the current location

        :param Mount mount: The mount to drop a tip from
        :param bool home_after: Home the plunger motor after dropping tip. This
                                is used in case the plunger motor skipped while
                                dropping the tip, and is also used to recover
                                the ejector shroud after a drop.
        """
        ...


class EventSourcer(Protocol):
    """Protocol specifying how to react to events."""

    def register_callback(self, cb: HardwareEventHandler) -> Callable[[], None]:
        """Register a callback that will be called when an event occurs.

        The events may be asynchronous, from various things that can happen
        to the hardware (for instance, the door opening or closing).

        The returned callable removes the callback.
        """
        ...


class ChassisAccessoryManager(EventSourcer, Protocol):
    """Protocol specifying control of non-motion peripherals on the robot."""

    @property
    def door_state(self) -> DoorState:
        """The current state of the machine's door."""
        ...

    async def set_lights(self, button: bool = None, rails: bool = None) -> None:
        """Control the robot lights.

        button If specified, turn the button light on (`True`) or
               off (`False`). If not specified, do not change the
               button light.
        rails: If specified, turn the rail lights on (`True`) or
               off (`False`). If not specified, do not change the
               rail lights.
        """
        ...

    def get_lights(self) -> Dict[str, bool]:
        """Return the current status of the robot lights.

        :returns: A dict of the lights: `{'button': bool, 'rails': bool}`
        """
        ...

    async def identify(self, duration_s: int = 5) -> None:
        """Run a routine to identify the robot.

        duration_s: The duration to blink for, in seconds.
        """
        ...


class HardwareManager(Protocol):
    """Protocol specifying access to configuration plane elements of hardware."""

    def get_fw_version(self) -> str:
        """
        Return the firmware version of the connected hardware.
        """
        ...

    @property
    def fw_version(self) -> str:
        """
        Return the firmware version of the connected hardware.

        The version is a string retrieved directly from the attached hardware
        (or possibly simulator).
        """
        ...

    @property
    def board_revision(self) -> str:
        """
        Return the revision of the central hardware.
        """
        ...


class AsyncioConfigurable(Protocol):
    """Protocol specifying controllability of asyncio behavior"""

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """The event loop used by this instance."""
        ...

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Override the loop used by this instance."""
        ...


class Stoppable(Protocol):
    """Protocol specifying controllability of teardown"""

    def clean_up(self) -> None:
        """Get the API ready to stop cleanly."""
        ...


class Simulatable(Protocol):
    """Protocol specifying ability to simulate"""

    @property
    def is_simulator(self):
        """`True` if this is a simulator; `False` otherwise."""
        ...


class BaseHardwareControl(
    ModuleProvider,
    ExecutionControllable,
    LiquidHandler,
    ChassisAccessoryManager,
    HardwareManager,
    AsyncioConfigurable,
    Stoppable,
    Simulatable,
    Protocol,
):
    """A mypy protocol for a hardware controller.

    This class provides an protocol for the basic hardware controller class,
    with at least two implementations: one for the OT-2, and one for the
    OT-3. While the two classes have the same API, fundamental architectural
    decisions in the OT-2 hardware controller (specifically the data types used
    in the HardwareControl/backend split) make it unsuitable for the OT-3.

    This is a protocol rather than an ABC because of the use of wrapping adapters
    such as ThreadManager and SynchAdapter. Because those classes work via
    getattr, they can't inherit from an ABC that requires specific methods;
    however, they can satisfy protocols.
    """
