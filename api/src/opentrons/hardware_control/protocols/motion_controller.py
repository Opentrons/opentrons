from typing import Dict, List, Optional
from typing_extensions import Protocol

from opentrons.types import Mount, Point
from ..types import Axis, CriticalPoint, MotionChecks


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
    async def home_z(self, mount: Optional[Mount] = None) -> None:
        """Home a selected z-axis, or both if not specified."""
        ...

    async def home_plunger(self, mount: Mount) -> None:
        """
        Home the plunger motor for a mount, and then return it to the 'bottom'
        position.

        mount: the mount associated with the target plunger
        """
        ...

    async def home(self, axes: Optional[List[Axis]] = None) -> None:
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
        critical_point: Optional[CriticalPoint] = None,
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
        mount: Mount,
        abs_position: Point,
        speed: Optional[float] = None,
        critical_point: Optional[CriticalPoint] = None,
        max_speeds: Optional[Dict[Axis, float]] = None,
    ) -> None:
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
        mount: Mount,
        delta: Point,
        speed: Optional[float] = None,
        max_speeds: Optional[Dict[Axis, float]] = None,
        check_bounds: MotionChecks = MotionChecks.NONE,
        fail_on_not_homed: bool = False,
    ) -> None:
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

    async def retract(self, mount: Mount, margin: float = 10) -> None:
        """Pull the specified mount up to its home position.

        Works regardless of critical point or home status.
        """
        ...
