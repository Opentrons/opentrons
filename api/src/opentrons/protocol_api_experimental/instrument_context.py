# noqa: D100

from __future__ import annotations

from typing import Optional, Union, Sequence, List

from .labware import Well, Labware

from opentrons import APIVersion, types
from opentrons.hardware_control.dev_types import PipetteDict

# todo(mm, 2021-04-09): Duplicate these classes in this package to
# decouple from the v2 opentrons.protocol_api?
from opentrons.protocol_api import PairedInstrumentContext
from opentrons.protocol_api.instrument_context import AdvancedLiquidHandling
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient

# todo(mm, 2021-04-09): How customer-facing are these classes? Should they be
# accessible and documented as part of this package?
from opentrons.protocols.api_support.util import (
    PlungerSpeeds, FlowRates, Clearances
)


# todo(mm, 2021-04-09): Can/should we change "Instrument" to "Pipette"?
# todo(mm, 2021-04-09): Can/should we remove the word "Context" from the name?
class InstrumentContext:  # noqa: D101

    def __init__(self, client: ProtocolEngineClient, resource_id: str) -> None:  # noqa: D107, E501
        self._client = client
        self._resource_id = resource_id

    @property
    def api_version(self) -> APIVersion:  # noqa: D102
        raise NotImplementedError()

    @property
    def starting_tip(self) -> Optional[Well]:  # noqa: D102
        raise NotImplementedError()

    @starting_tip.setter
    def starting_tip(self, location: Optional[Well]) -> None:
        raise NotImplementedError()

    def reset_tipracks(self) -> None:  # noqa: D102
        raise NotImplementedError()

    @property
    def default_speed(self) -> float:  # noqa: D102
        raise NotImplementedError()

    @default_speed.setter
    def default_speed(self, speed: float) -> None:
        raise NotImplementedError()

    def aspirate(self,  # noqa: D102
                 volume: Optional[float] = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> InstrumentContext:
        raise NotImplementedError()

    def dispense(self,  # noqa: D102
                 volume: Optional[float] = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> InstrumentContext:
        raise NotImplementedError()

    def mix(self,  # noqa: D102
            repetitions: int = 1,
            volume: Optional[float] = None,
            location: Union[types.Location, Well] = None,
            rate: float = 1.0) -> InstrumentContext:
        raise NotImplementedError()

    def blow_out(self,  # noqa: D102
                 location: Union[types.Location, Well] = None
                 ) -> InstrumentContext:
        raise NotImplementedError()

    def touch_tip(self,  # noqa: D102
                  location: Optional[Well] = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> InstrumentContext:
        raise NotImplementedError()

    def air_gap(self,  # noqa: D102
                volume: Optional[float] = None,
                height: Optional[float] = None) -> InstrumentContext:
        raise NotImplementedError()

    def return_tip(self, home_after: bool = True) -> InstrumentContext:  # noqa: D102
        raise NotImplementedError()

    def pick_up_tip(  # noqa: D102
            self,
            location: Union[types.Location, Well] = None,
            presses: Optional[int] = None,
            increment: Optional[float] = None) -> InstrumentContext:
        # TODO(al, 2021-04-12): What about presses and increment? They are not
        #  supported by PE command. They are also not supported by PD protocols
        #  either.
        if presses is not None or increment is not None:
            raise NotImplementedError()
        if isinstance(location, Well):
            self._client.pick_up_tip(
                pipette_id=self._resource_id,
                labware_id=location.parent.resource_id,
                well_name=location.well_name
            )
        else:
            # TODO(al, 2021-04-12): Support for picking up next tip in a labware
            #  and in tipracks associated with a pipette
            raise NotImplementedError()

        return self

    def drop_tip(  # noqa: D102
            self,
            location: Union[types.Location, Well] = None,
            home_after: bool = True) -> InstrumentContext:
        # TODO(al, 2021-04-12): What about home_after?
        if not home_after:
            raise NotImplementedError()
        if isinstance(location, Well):
            self._client.drop_tip(
                pipette_id=self._resource_id,
                labware_id=location.parent.resource_id,
                well_name=location.well_name
            )
        else:
            # TODO(al, 2021-04-12): Support for dropping tip in trash.
            raise NotImplementedError()

        return self

    def home(self) -> InstrumentContext:  # noqa: D102
        raise NotImplementedError()

    def home_plunger(self) -> InstrumentContext:  # noqa: D102
        raise NotImplementedError()

    def distribute(self,  # noqa: D102
                   volume: Union[float, Sequence[float]],
                   source: Well,
                   dest: List[Well],
                   *args,  # noqa: ANN002
                   **kwargs,  # noqa: ANN003
                   ) -> InstrumentContext:
        raise NotImplementedError()

    def consolidate(self,  # noqa: D102
                    volume: Union[float, Sequence[float]],
                    source: List[Well],
                    dest: Well,
                    *args,  # noqa: ANN002
                    **kwargs  # noqa: ANN003
                    ) -> InstrumentContext:
        raise NotImplementedError()

    def transfer(self,  # noqa: D102
                 volume: Union[float, Sequence[float]],
                 source: AdvancedLiquidHandling,
                 dest: AdvancedLiquidHandling,
                 trash: bool = True,
                 **kwargs  # noqa: ANN003
                 ) -> InstrumentContext:
        raise NotImplementedError()

    def delay(self) -> None:  # noqa: D102
        raise NotImplementedError()

    def move_to(self,  # noqa: D102
                location: types.Location,
                force_direct: bool = False,
                minimum_z_height: Optional[float] = None,
                speed: Optional[float] = None
                ) -> InstrumentContext:
        raise NotImplementedError()

    @property
    def mount(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def speed(self) -> PlungerSpeeds:  # noqa: D102
        raise NotImplementedError()

    @property
    def flow_rate(self) -> FlowRates:  # noqa: D102
        raise NotImplementedError()

    @property
    def type(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def tip_racks(self) -> List[Labware]:  # noqa: D102
        raise NotImplementedError()

    @tip_racks.setter
    def tip_racks(self, racks: List[Labware]) -> None:
        raise NotImplementedError()

    @property
    def trash_container(self) -> Labware:  # noqa: D102
        raise NotImplementedError()

    @trash_container.setter
    def trash_container(self, trash: Labware) -> None:
        raise NotImplementedError()

    @property
    def name(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def model(self) -> str:  # noqa: D102
        raise NotImplementedError()

    @property
    def min_volume(self) -> float:  # noqa: D102
        raise NotImplementedError()

    @property
    def max_volume(self) -> float:  # noqa: D102
        raise NotImplementedError()

    @property
    def current_volume(self) -> float:  # noqa: D102
        raise NotImplementedError()

    @property
    def has_tip(self) -> bool:  # noqa: D102
        raise NotImplementedError()

    @property
    def hw_pipette(self) -> PipetteDict:  # noqa: D102
        raise NotImplementedError()

    @property
    def channels(self) -> int:  # noqa: D102
        raise NotImplementedError()

    @property
    def return_height(self) -> float:  # noqa: D102
        raise NotImplementedError()

    @property
    def well_bottom_clearance(self) -> Clearances:  # noqa: D102
        raise NotImplementedError()

    def __repr__(self) -> str:  # noqa: D105
        raise NotImplementedError()

    def __str__(self) -> str:  # noqa: D105
        raise NotImplementedError()

    def pair_with(  # noqa: D102
            self, instrument: InstrumentContext) -> PairedInstrumentContext:
        raise NotImplementedError()
