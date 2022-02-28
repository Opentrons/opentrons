from typing import Dict, Optional
from typing_extensions import Protocol

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import Mount

from ..pipette import Pipette
from ..dev_types import PipetteDict
from ..types import CriticalPoint


class InstrumentConfigurer(Protocol):
    """A protocol specifying how to interact with instrument presence and detection."""

    def reset_instrument(self, mount: Optional[Mount] = None) -> None:
        """
        Reset the internal state of a pipette by its mount, without doing
        any lower level reconfiguration. This is useful to make sure that no
        settings changes from a protocol persist.

        mount: If specified, reset that mount. If not specified, reset both
        """
        ...

    async def cache_instruments(
        self,
        require: Optional[Dict[Mount, PipetteName]] = None,
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
        top: Optional[float] = None,
        bottom: Optional[float] = None,
        blow_out: Optional[float] = None,
        drop_tip: Optional[float] = None,
    ) -> None:
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
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        """Set a pipette's rate of liquid handling in flow rate units"""
        ...

    def set_pipette_speed(
        self,
        mount: Mount,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        """Set a pipette's rate of liquid handling in linear speed units."""
        ...

    def get_instrument_max_height(
        self,
        mount: Mount,
        critical_point: Optional[CriticalPoint] = None,
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
        self, mount: Mount, tiprack_diameter: float
    ) -> None:
        """Inform the hardware of the diameter of the tiprack.

        This drives the magnitude of the shake commanded for pipettes that need
        a shake after dropping or picking up tips.
        """
        ...

    def set_working_volume(self, mount: Mount, tip_volume: int) -> None:
        """Inform the hardware how much volume a pipette can aspirate.

        This will set the limit of aspiration for the pipette, and is
        necessary for backcompatibility.
        """
        ...

    @property
    def hardware_instruments(self) -> Dict[Mount, Optional[Pipette]]:
        """Return the underlying hardware representation of the instruments.

        This should rarely be used. Do not write new code that uses it.
        """
        ...
