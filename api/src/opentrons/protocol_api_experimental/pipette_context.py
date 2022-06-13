# noqa: D100

from __future__ import annotations

from typing import Any, Optional, Union, Sequence, List

from .labware import Labware
from .well import Well

from opentrons import types
from opentrons.protocols.api_support.types import APIVersion
from opentrons.hardware_control.dev_types import PipetteDict

# todo(mm, 2021-04-09): Duplicate these classes in this package to
# decouple from the v2 opentrons.protocol_api?
from opentrons.protocol_api.instrument_context import AdvancedLiquidHandling
from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient

# todo(mm, 2021-04-09): How customer-facing are these classes? Should they be
# accessible and documented as part of this package?
from opentrons.protocols.api_support.util import PlungerSpeeds, FlowRates, Clearances


# todo(mm, 2021-04-09): Can/should we remove the word "Context" from the name?
class PipetteContext:  # noqa: D101
    def __init__(
        self,
        engine_client: ProtocolEngineClient,
        pipette_id: str,
    ) -> None:
        """Initialize a PipetteContext API provider.

        You should not need to call this constructor yourself. The system will
        create a PipetteContext for you when you call :py:meth:`load_pipette`.

        Args:
            engine_client: A client to access protocol state and execute commands.
            pipette_id: The pipette's identifier in commands and protocol state.
        """
        self._engine_client = engine_client
        self._pipette_id = pipette_id

    def __hash__(self) -> int:
        """Get hash.

        Uses the pipette instance's unique identifier in protocol state.
        """
        return hash(self._pipette_id)

    def __eq__(self, other: object) -> bool:
        """Compare for object equality.

        Checks that other object is a `PipetteContext` and has the same identifier.
        """
        return (
            isinstance(other, PipetteContext) and self._pipette_id == other._pipette_id
        )

    def __repr__(self) -> str:  # noqa: D105
        # TODO: https://github.com/Opentrons/opentrons/issues/9510
        raise NotImplementedError()

    @property
    def api_version(self) -> APIVersion:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9452
        raise NotImplementedError()

    @property
    def starting_tip(self) -> Optional[Well]:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9463
        raise NotImplementedError()

    @starting_tip.setter
    def starting_tip(self, location: Optional[Well]) -> None:
        # TODO: https://github.com/Opentrons/opentrons/issues/9463
        raise NotImplementedError()

    def reset_tipracks(self) -> None:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9463
        raise NotImplementedError()

    @property
    def default_speed(self) -> float:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9453
        raise NotImplementedError()

    @default_speed.setter
    def default_speed(self, speed: float) -> None:
        # TODO: https://github.com/Opentrons/opentrons/issues/9453
        raise NotImplementedError()

    def aspirate(  # noqa: D102
        self,
        volume: Optional[float] = None,
        location: Optional[Union[types.Location, Well]] = None,
        rate: float = 1.0,
    ) -> PipetteContext:

        if volume is None or volume == 0:
            # TODO(mm, 2021-04-14): If None or 0, use highest volume possible.
            # https://github.com/Opentrons/opentrons/issues/9513
            raise NotImplementedError("volume must be specified.")

        if rate != 1:
            # TODO: https://github.com/Opentrons/opentrons/issues/9465
            raise NotImplementedError(
                "Protocol Engine does not yet support adjusting flow rates."
            )

        if isinstance(location, Well):
            self._engine_client.aspirate(
                pipette_id=self._pipette_id,
                labware_id=location.parent.labware_id,
                well_name=location.well_name,
                well_location=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    # TODO(mm, 2021-04-14): Get default offset in well via
                    # self.well_bottom_clearance.aspirate, instead of hard-coding.
                    # https://github.com/Opentrons/opentrons/issues/9512
                    offset=WellOffset(x=0, y=0, z=1),
                ),
                volume=volume,
            )
        else:
            # TODO(mm, 2021-04-14):
            #   * If location is None, use current location.
            #   * If location is a Location (possibly deck coords, or possibly
            #     something like well.top()), use that.
            # https://github.com/Opentrons/opentrons/issues/9509
            raise NotImplementedError(
                "locations other than Wells are currently unsupported."
            )

        return self

    def dispense(  # noqa: D102
        self,
        volume: Optional[float] = None,
        location: Optional[Union[types.Location, Well]] = None,
        rate: float = 1.0,
    ) -> PipetteContext:

        if rate != 1:
            # TODO: https://github.com/Opentrons/opentrons/issues/9465
            raise NotImplementedError("Flow rate adjustment not yet supported in PE.")

        if volume is None or volume == 0:
            # TODO: https://github.com/Opentrons/opentrons/issues/9513
            raise NotImplementedError("Volume tracking not yet supported in PE.")

        # TODO (spp:
        #  - Disambiguate location. Cases in point:
        #       1. location not specified; use current labware & well
        #       2. specified location is a Point)
        #  - Use well_bottom_clearance as offset for well_location(?)
        if isinstance(location, Well):
            self._engine_client.dispense(
                pipette_id=self._pipette_id,
                labware_id=location.parent.labware_id,
                well_name=location.well_name,
                well_location=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    # https://github.com/Opentrons/opentrons/issues/9512
                    offset=WellOffset(x=0, y=0, z=1),
                ),
                volume=volume,
            )
        else:
            # TODO: https://github.com/Opentrons/opentrons/issues/9509
            raise NotImplementedError(
                "Dispensing to a non-well location not yet supported in PE."
            )
        return self

    def mix(  # noqa: D102
        self,
        repetitions: int = 1,
        volume: Optional[float] = None,
        location: Optional[Union[types.Location, Well]] = None,
        rate: float = 1.0,
    ) -> PipetteContext:
        # TODO: https://github.com/Opentrons/opentrons/issues/9466
        raise NotImplementedError()

    def blow_out(  # noqa: D102
        self,
        location: Optional[Union[types.Location, Well]] = None,
    ) -> PipetteContext:
        # TODO: https://github.com/opentrons/opentrons/issues/9524
        if isinstance(location, Well):
            self._engine_client.blow_out(
                pipette_id=self._pipette_id,
                labware_id=location.parent.labware_id,
                well_name=location.well_name,
                well_location=WellLocation(),
            )
        else:
            # TODO(tz, 2022-06-09): Handle logic in case location
            #  is types.Location or is None
            raise NotImplementedError(
                "Blowout locations other than Wells are currently unsupported."
            )

        return self

    def touch_tip(  # noqa: D102
        self,
        location: Optional[Well] = None,
        radius: float = 1.0,
        v_offset: float = -1.0,
        speed: float = 60.0,
    ) -> PipetteContext:

        if location is None:
            raise NotImplementedError("Not including location not yet supported in PE.")
        if radius != 1.0:
            raise NotImplementedError("Radius adjustment not yet supported in PE.")
        if speed != 60.0:
            raise NotImplementedError("Speed parameter not yet supported in PE.")

        self._engine_client.touch_tip(
            pipette_id=self._pipette_id,
            labware_id=location.parent.labware_id,
            well_name=location.well_name,
            well_location=WellLocation(
                origin=WellOrigin.TOP,
                offset=WellOffset(x=0, y=0, z=v_offset),
            ),
        )
        return self

    def air_gap(  # noqa: D102
        self,
        volume: Optional[float] = None,
        height: Optional[float] = None,
    ) -> PipetteContext:
        # TODO: https://github.com/Opentrons/opentrons/issues/9525
        raise NotImplementedError()

    def return_tip(self, home_after: bool = True) -> PipetteContext:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9523
        raise NotImplementedError()

    def pick_up_tip(  # noqa: D102
        self,
        location: Optional[Union[types.Location, Well]] = None,
        presses: Optional[int] = None,
        increment: Optional[float] = None,
    ) -> PipetteContext:
        # TODO(al, 2021-04-12): What about presses and increment? They are not
        # supported by PE command. They are also not supported by PD protocols
        # either. https://github.com/Opentrons/opentrons/issues/9523
        if presses is not None or increment is not None:
            raise NotImplementedError()

        if isinstance(location, Well):
            self._engine_client.pick_up_tip(
                pipette_id=self._pipette_id,
                labware_id=location.parent.labware_id,
                well_name=location.well_name,
            )
        else:
            # TODO(al, 2021-04-12): Support for picking up next tip in a labware
            #  and in tipracks associated with a pipette
            # https://github.com/Opentrons/opentrons/issues/9461
            raise NotImplementedError()

        return self

    def drop_tip(  # noqa: D102
        self,
        location: Optional[Union[types.Location, Well]] = None,
        home_after: bool = True,
    ) -> PipetteContext:
        # TODO(al, 2021-04-12): What about home_after?
        # https://github.com/Opentrons/opentrons/issues/9470
        if not home_after:
            raise NotImplementedError()

        if isinstance(location, Well):
            self._engine_client.drop_tip(
                pipette_id=self._pipette_id,
                labware_id=location.parent.labware_id,
                well_name=location.well_name,
            )
        else:
            # TODO(al, 2021-04-12): Support for dropping tip in trash.
            # https://github.com/Opentrons/opentrons/issues/9521
            raise NotImplementedError()

        return self

    def home(self) -> PipetteContext:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9470
        raise NotImplementedError()

    def home_plunger(self) -> PipetteContext:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9470
        raise NotImplementedError()

    # TODO(mc, 2021-09-12): explicitely type kwargs, remove args
    def distribute(  # noqa: D102
        self,
        volume: Union[float, Sequence[float]],
        source: Well,
        dest: List[Well],
        *args: Any,
        **kwargs: Any,
    ) -> PipetteContext:
        # TODO: https://github.com/Opentrons/opentrons/issues/9522
        raise NotImplementedError()

    # TODO(mc, 2021-09-12): explicitely type kwargs, remove args
    def consolidate(  # noqa: D102
        self,
        volume: Union[float, Sequence[float]],
        source: List[Well],
        dest: Well,
        *args: Any,
        **kwargs: Any,
    ) -> PipetteContext:
        # TODO: https://github.com/Opentrons/opentrons/issues/9522
        raise NotImplementedError()

    # TODO(mc, 2021-09-12): explicitely type kwargs
    def transfer(  # noqa: D102
        self,
        volume: Union[float, Sequence[float]],
        source: AdvancedLiquidHandling,
        dest: AdvancedLiquidHandling,
        trash: bool = True,
        **kwargs: Any,
    ) -> PipetteContext:
        # TODO: https://github.com/Opentrons/opentrons/issues/9522
        raise NotImplementedError()

    def move_to(  # noqa: D102
        self,
        location: types.Location,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> PipetteContext:
        # TODO: https://github.com/Opentrons/opentrons/issues/9514
        raise NotImplementedError()

    @property
    def mount(self) -> str:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9516
        raise NotImplementedError()

    @property
    def speed(self) -> PlungerSpeeds:  # noqa: D102
        # TODO(mc, 2022-02-18): Remove this unhelpful API
        # see https://github.com/Opentrons/opentrons/issues/4837
        raise NotImplementedError()

    @property
    def flow_rate(self) -> FlowRates:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9465
        raise NotImplementedError()

    @property
    def type(self) -> str:  # noqa: D102
        # TODO(mc, 2022-02-18): remove as redundant and confusing?
        raise NotImplementedError()

    @property
    def tip_racks(self) -> List[Labware]:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9461
        raise NotImplementedError()

    @tip_racks.setter
    def tip_racks(self, racks: List[Labware]) -> None:
        # TODO: https://github.com/Opentrons/opentrons/issues/9461
        raise NotImplementedError()

    @property
    def trash_container(self) -> Labware:  # noqa: D102
        # https://github.com/Opentrons/opentrons/issues/9521
        raise NotImplementedError()

    @trash_container.setter
    def trash_container(self, trash: Labware) -> None:
        # https://github.com/Opentrons/opentrons/issues/9521
        raise NotImplementedError()

    @property
    def name(self) -> str:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9516
        raise NotImplementedError()

    @property
    def model(self) -> str:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9516
        raise NotImplementedError()

    @property
    def min_volume(self) -> float:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9516
        raise NotImplementedError()

    @property
    def max_volume(self) -> float:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9516
        raise NotImplementedError()

    @property
    def current_volume(self) -> float:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9520
        raise NotImplementedError()

    @property
    def has_tip(self) -> bool:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9520
        raise NotImplementedError()

    @property
    def hw_pipette(self) -> PipetteDict:  # noqa: D102
        # TODO(mc, 2022-02-18): this may not be appropriate to carry forward
        # investigate whether we want this for PAPIv3.
        raise NotImplementedError()

    @property
    def channels(self) -> int:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9516
        raise NotImplementedError()

    @property
    def return_height(self) -> float:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9516
        raise NotImplementedError()

    @property
    def well_bottom_clearance(self) -> Clearances:  # noqa: D102
        # TODO: https://github.com/Opentrons/opentrons/issues/9512
        raise NotImplementedError()
