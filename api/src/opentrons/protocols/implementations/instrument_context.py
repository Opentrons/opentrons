import typing

from opentrons import types
from opentrons.protocols.api_support.util import Clearances, FlowRates, \
    PlungerSpeeds, build_edges
from opentrons.protocols.implementations.interfaces.instrument_context import \
    InstrumentContextInterface
from opentrons.protocols.implementations.interfaces.labware import \
    LabwareInterface
from opentrons.protocols.implementations.interfaces.protocol_context import \
    ProtocolContextInterface
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.types import APIVersion


class InstrumentContextImplementation(InstrumentContextInterface):
    """Implementation of the InstrumentContext interface."""

    _api_version: APIVersion
    _protocol_interface: ProtocolContextInterface
    _mount: types.Mount
    _instrument_name: str
    _starting_tip: typing.Optional[WellImplementation]
    _default_speed: float
    _well_bottom_clearances: Clearances

    def __init__(self,
                 api_version: APIVersion,
                 protocol_interface: ProtocolContextInterface,
                 mount: types.Mount,
                 instrument_name: str,
                 default_speed: float):
        """"Constructor"""
        self._api_version = api_version
        self._protocol_interface = protocol_interface
        self._mount = mount
        self._instrument_name = instrument_name
        self._default_speed = default_speed
        self._well_bottom_clearances = Clearances(
            default_aspirate=1.0, default_dispense=1.0
        )

    def get_api_version(self) -> APIVersion:
        """Get the API Version for this context's protocol."""
        return self._api_version

    def get_starting_tip(self) -> typing.Optional[WellImplementation]:
        """Gets the starting tip."""
        return self._starting_tip

    def set_starting_tip(self, location: typing.Optional[WellImplementation]):
        """Sets the starting tip."""
        self._starting_tip = location

    def reset_tipracks(self) -> None:
        """Reload all tips in each tip rack and reset starting tip."""
        for tiprack in self.get_tip_racks():
            tiprack.reset_tips()
        self.set_starting_tip(None)

    def get_default_speed(self) -> float:
        """Gets the speed at whcih the robot's gandry moves."""
        return self._default_speed

    def set_default_speed(self, speed: float) -> None:
        """Sets the speed at whcih the robot's gandry moves."""
        self._default_speed = speed

    def aspirate(self,
                 volume: float,
                 location: types.Location,
                 rate: float = 1.0) -> None:
        """Aspirate a given volume of liquid from the specified location, using
        this pipette."""
        self._protocol_interface.get_hardware().hardware.aspirate(
            self._mount, volume, rate
        )

    def dispense(self, volume: float, location: types.Location,
                 rate: float = 1.0) -> None:
        """Dispense a volume of liquid (in microliters/uL) using this pipette
        into the specified location."""
        self._protocol_interface.get_hardware().hardware.dispense(
            self._mount, volume, rate
        )

    def blow_out(self, location: types.Location) -> None:
        """Blow liquid out of the tip."""
        self._protocol_interface.get_hardware().hardware.blow_out(self._mount)

    def touch_tip(self,
                  location: WellImplementation,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> None:
        """
        Touch the pipette tip to the sides of a well, with the intent of
        removing left-over droplets
        """
        edges = build_edges(
            location, v_offset, self._mount,
            self._protocol_interface.get_deck(),
            radius,
            self.get_api_version()
        )
        for edge in edges:
            self._protocol_interface.get_hardware().hardware.move_to(
                self._mount,
                edge,speed
            )

    def pick_up_tip(self,
                    location: types.Location,
                    presses: int = None,
                    increment: float = None) -> None:
        pass

    def drop_tip(self, location: types.Location,
                 home_after: bool = True) -> None:
        pass

    def home(self) -> None:
        """Home the mount"""
        self._protocol_interface.get_hardware().hardware.home_z(self._mount)
        self.home_plunger()

    def home_plunger(self) -> None:
        """Home the plunger associated with this mount."""
        self._protocol_interface.get_hardware().hardware.home_plunger(
            self._mount
        )

    def delay(self) -> None:
        pass

    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: float = None, speed: float = None) -> None:
        pass

    def get_mount(self) -> types.Mount:
        return self._mount

    def get_speed(self) -> PlungerSpeeds:
        pass

    def get_flow_rate(self) -> FlowRates:
        pass

    def get_tip_racks(self) -> typing.List[LabwareInterface]:
        pass

    def set_tip_racks(self, racks: typing.List[LabwareInterface]):
        pass

    def get_trash_container(self) -> LabwareInterface:
        pass

    def set_trash_container(self, trash: LabwareInterface):
        pass

    def get_instrument_name(self) -> str:
        return self._instrument_name

    def get_pipette_name(self) -> str:
        return self.get_pipette()['name']

    def get_model(self) -> str:
        return self.get_pipette()['model']

    def get_min_volume(self) -> float:
        return self.get_pipette()['min_volume']

    def get_max_volume(self) -> float:
        return self.get_pipette()['max_volume']

    def get_current_volume(self) -> float:
        return self.get_pipette()['current_volume']

    def get_available_volume(self) -> float:
        return self.get_pipette()['available_volume']

    def get_current_location(self) -> types.Location:
        pass

    def get_pipette(self) -> typing.Dict[str, typing.Any]:
        pipette = self._protocol_interface.get_hardware().hardware.attached_instruments[self._mount]
        if pipette is None:
            raise types.PipetteNotAttachedError
        return pipette

    def get_channels(self) -> int:
        return self.get_pipette()['channels']

    def has_tip(self) -> bool:
        return self.get_pipette()['has_tip']

    def get_return_height(self) -> float:
        return self.get_pipette().get('return_tip_height', 0.5)

    def get_well_bottom_clearance(self) -> Clearances:
        return self._well_bottom_clearances
