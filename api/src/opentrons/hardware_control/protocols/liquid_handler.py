from typing import Optional
from typing_extensions import Protocol

from opentrons.types import Mount

from .instrument_configurer import InstrumentConfigurer
from .motion_controller import MotionController
from .configurable import Configurable
from .calibratable import Calibratable


class LiquidHandler(
    InstrumentConfigurer,
    MotionController,
    Configurable,
    Calibratable,
    Protocol,
):
    async def prepare_for_aspirate(self, mount: Mount, rate: float = 1.0) -> None:
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
        mount: Mount,
        volume: Optional[float] = None,
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
        mount: Mount,
        volume: Optional[float] = None,
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

    async def blow_out(self, mount: Mount) -> None:
        """
        Force any remaining liquid to dispense. The liquid will be dispensed at
        the current location of pipette
        """
        ...

    async def pick_up_tip(
        self,
        mount: Mount,
        tip_length: float,
        presses: Optional[int] = None,
        increment: Optional[float] = None,
        prep_after: bool = True,
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

    async def drop_tip(
        self,
        mount: Mount,
        home_after: bool = True,
    ) -> None:
        """
        Drop tip at the current location

        :param Mount mount: The mount to drop a tip from
        :param bool home_after: Home the plunger motor after dropping tip. This
                                is used in case the plunger motor skipped while
                                dropping the tip, and is also used to recover
                                the ejector shroud after a drop.
        """
        ...
