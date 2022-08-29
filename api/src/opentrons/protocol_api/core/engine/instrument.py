"""ProtocolEngine-based InstrumentContext core implementation."""
from typing import Optional

from opentrons.types import Location, Mount
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import Clearances, PlungerSpeeds, FlowRates

from ..instrument import AbstractInstrument
from .well import WellCore


class InstrumentCore(AbstractInstrument[WellCore]):
    """Instrument API core using a ProtocolEngine.

    Args:
        pipette_id: ProtocolEngine ID of the loaded instrument.
    """

    def __init__(self, pipette_id: str) -> None:
        self._pipette_id = pipette_id

    @property
    def pipette_id(self) -> str:
        """The instrument's unique ProtocolEngine ID."""
        return self._pipette_id

    def get_default_speed(self) -> float:
        raise NotImplementedError("InstrumentCore not implemented")

    def set_default_speed(self, speed: float) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def aspirate(self, volume: float, rate: float) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def dispense(self, volume: float, rate: float) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def blow_out(self) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def touch_tip(
        self,
        location: WellCore,
        radius: float,
        v_offset: float,
        speed: float,
    ) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def pick_up_tip(
        self,
        well: WellCore,
        tip_length: float,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool,
    ) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def drop_tip(self, home_after: bool) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def home(self) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def home_plunger(self) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def move_to(
        self,
        location: Location,
        force_direct: bool,
        minimum_z_height: Optional[float],
        speed: Optional[float],
    ) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_mount(self) -> Mount:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_instrument_name(self) -> str:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_pipette_name(self) -> str:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_model(self) -> str:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_min_volume(self) -> float:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_max_volume(self) -> float:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_current_volume(self) -> float:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_available_volume(self) -> float:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_pipette(self) -> PipetteDict:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_channels(self) -> int:
        raise NotImplementedError("InstrumentCore not implemented")

    def has_tip(self) -> bool:
        raise NotImplementedError("InstrumentCore not implemented")

    def is_ready_to_aspirate(self) -> bool:
        raise NotImplementedError("InstrumentCore not implemented")

    def prepare_for_aspirate(self) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_return_height(self) -> float:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_well_bottom_clearance(self) -> Clearances:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_speed(self) -> PlungerSpeeds:
        raise NotImplementedError("InstrumentCore not implemented")

    def get_flow_rate(self) -> FlowRates:
        raise NotImplementedError("InstrumentCore not implemented")

    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        raise NotImplementedError("InstrumentCore not implemented")

    def set_pipette_speed(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        raise NotImplementedError("InstrumentCore not implemented")
