import typing

from opentrons import types
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import FlowRates, PlungerSpeeds, \
    Clearances
from opentrons.protocols.implementations.interfaces.instrument_context import \
    InstrumentContextInterface
from opentrons.protocols.implementations.interfaces.protocol_context import \
    ProtocolContextInterface
from opentrons.protocols.implementations.well import WellImplementation


class SimInstrumentContext(InstrumentContextInterface):

    def __init__(self,
                 protocol_interface: ProtocolContextInterface,
                 pipette_dict: PipetteDict,
                 mount: types.Mount,
                 instrument_name: str):
        self._protocol_interface = protocol_interface
        self._mount = mount
        self._pipette_dict = pipette_dict
        self._instrument_name = instrument_name

    def get_default_speed(self) -> float:
        return 40

    def set_default_speed(self, speed: float) -> None:
        pass

    def aspirate(self, volume: float, rate: float = 1.0) -> None:
        pass

    def dispense(self, volume: float, rate: float = 1.0) -> None:
        pass

    def blow_out(self) -> None:
        pass

    def touch_tip(self, location: WellImplementation, radius: float = 1.0,
                  v_offset: float = -1.0, speed: float = 60.0) -> None:
        pass

    def pick_up_tip(self, well: WellImplementation, tip_length: float,
                    presses: typing.Optional[int] = None,
                    increment: typing.Optional[float] = None) -> None:
        pass

    def drop_tip(self, home_after: bool = True) -> None:
        pass

    def home(self) -> None:
        pass

    def home_plunger(self) -> None:
        pass

    def delay(self) -> None:
        pass

    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: typing.Optional[float] = None,
                speed: typing.Optional[float] = None) -> None:
        pass

    def get_mount(self) -> types.Mount:
        return self._mount

    def get_instrument_name(self) -> str:
        return self._instrument_name

    def get_pipette_name(self) -> str:
        return self._pipette_dict['name']

    def get_model(self) -> str:
        return self._pipette_dict['model']

    def get_min_volume(self) -> float:
        return self._pipette_dict['min_volume']

    def get_max_volume(self) -> float:
        return self._pipette_dict['max_volume']

    def get_current_volume(self) -> float:
        return self._pipette_dict['current_volume']

    def get_available_volume(self) -> float:
        return self._pipette_dict['available_volume']

    def get_pipette(self) -> PipetteDict:
        return self._pipette_dict

    def get_channels(self) -> int:
        return self._pipette_dict['channels']

    def has_tip(self) -> bool:
        return self._pipette_dict['has_tip']

    def is_ready_to_aspirate(self) -> bool:
        return self._pipette_dict['ready_to_aspirate']

    def prepare_for_aspirate(self) -> None:
        pass

    def get_return_height(self) -> float:
        return self._pipette_dict['return_tip_height']

    def get_well_bottom_clearance(self) -> Clearances:
        return Clearances(default_aspirate=1, default_dispense=1)

    def get_speed(self) -> PlungerSpeeds:
        return PlungerSpeeds(self)

    def get_flow_rate(self) -> FlowRates:
        return FlowRates(self)

    def set_flow_rate(self, aspirate: typing.Optional[float] = None,
                      dispense: typing.Optional[float] = None,
                      blow_out: typing.Optional[float] = None) -> None:
        pass

    def set_pipette_speed(self, aspirate: typing.Optional[float] = None,
                          dispense: typing.Optional[float] = None,
                          blow_out: typing.Optional[float] = None) -> None:
        pass
