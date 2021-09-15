from typing import Optional, cast

from opentrons import types
from opentrons.hardware_control.modules import Thermocycler
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.context.paired_instrument import AbstractPairedInstrument
from opentrons.protocols.context.protocol import AbstractProtocol
from opentrons.protocols.geometry.module_geometry import ThermocyclerGeometry


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
        # Check for unsafe moves while thermocycler is open.
        from_loc = self._protocol_interface.get_last_location()
        if not from_loc:
            from_loc = types.Location(types.Point(0, 0, 0), LabwareLike(None))

        for mod in self._protocol_interface.get_loaded_modules().values():
            if isinstance(mod.module, Thermocycler):
                cast(ThermocyclerGeometry, mod.geometry).flag_unsafe_move(
                    to_loc=location,
                    from_loc=from_loc,
                    lid_position=mod.module.lid_status,
                )

        self._primary.move_to(
            location=location,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
            speed=speed,
        )
        self._secondary.move_to(
            location=location,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
            speed=speed,
        )

    def aspirate(
        self,
        volume: float,
        location: types.Location,
        rate: float,
    ) -> None:
        self._primary.aspirate(volume, rate)
        self._secondary.aspirate(volume, rate)

    def dispense(self, volume: float, location: types.Location, rate: float) -> None:
        self._primary.dispense(volume, rate)
        self._secondary.dispense(volume, rate)

    def blow_out(self, location: types.Location) -> None:
        self._primary.blow_out()
        self._secondary.blow_out()

    def touch_tip(
        self, well: Well, radius: float, v_offset: float, speed: float
    ) -> None:
        pass
