from typing import Optional, Tuple, Callable

from opentrons import types
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.context.paired_instrument import AbstractPairedInstrument
from opentrons.protocols.context.protocol import AbstractProtocol


class PairedInstrumentSimulation(AbstractPairedInstrument):
    def __init__(
        self,
        primary_instrument: AbstractInstrument,
        secondary_instrument: AbstractInstrument,
        ctx: AbstractProtocol,
    ):
        self._primary = primary_instrument
        self._secondary = secondary_instrument
        self._protocol_interface = ctx

    def pick_up_tip(
        self,
        target: Well,
        secondary_target: Well,
        tiprack: Labware,
        presses: Optional[int],
        increment: Optional[float],
        tip_length: float,
    ) -> None:
        self.move_to(target.top())

        self._primary.pick_up_tip(
            well=target._impl,
            tip_length=tip_length,
            presses=presses,
            increment=increment,
        )
        self._secondary.pick_up_tip(
            well=secondary_target._impl,
            tip_length=tip_length,
            presses=presses,
            increment=increment,
        )

        tiprack.use_tips(target, self._primary.get_channels())
        tiprack.use_tips(secondary_target, self._secondary.get_channels())

    def drop_tip(self, target: types.Location, home_after: bool) -> None:
        self._primary.drop_tip(home_after=home_after)
        self._secondary.drop_tip(home_after=home_after)

    def move_to(
        self,
        location: types.Location,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> None:
        self._protocol_interface.set_last_location(location)

    def aspirate(
        self,
        volume: Optional[float],
        location: Optional[types.Location] = None,
        rate: Optional[float] = 1.0,
    ) -> Tuple[types.Location, Callable]:
        location = location or self._protocol_interface.get_last_location()

        def _aspirate():
            self._primary.aspirate(volume, rate)
            self._secondary.aspirate(volume, rate)

        return location, _aspirate

    def dispense(
        self, volume: Optional[float], location: Optional[types.Location], rate: float
    ) -> Tuple[types.Location, Callable]:
        location = location or self._protocol_interface.get_last_location()

        def _aspirate():
            self._primary.dispense(volume, rate)
            self._secondary.dispense(volume, rate)

        return location, _aspirate

    def blow_out(self, location: types.Location) -> None:
        pass

    def air_gap(self, volume: Optional[float], height: float) -> None:
        pass

    def touch_tip(
        self, location: Optional[Well], radius: float, v_offset: float, speed: float
    ) -> None:
        pass
