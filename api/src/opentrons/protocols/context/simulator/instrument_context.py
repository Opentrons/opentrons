import typing

from opentrons import types
from opentrons.hardware_control import NoTipAttachedError, TipAttachedError
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.types import HardwareAction
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.api_support.util import FlowRates, PlungerSpeeds, \
    Clearances
from opentrons.protocols.geometry import planning
from opentrons.protocols.context.instrument import \
    AbstractInstrument
from opentrons.protocols.context.protocol import \
    AbstractProtocol
from opentrons.protocols.context.well import WellImplementation


class InstrumentContextSimulation(AbstractInstrument):
    """A simulation of an instrument context."""

    def __init__(self,
                 protocol_interface: AbstractProtocol,
                 pipette_dict: PipetteDict,
                 mount: types.Mount,
                 instrument_name: str,
                 default_speed: float = 400.0):
        """Constructor."""
        self._protocol_interface = protocol_interface
        self._mount = mount
        self._pipette_dict = pipette_dict
        self._instrument_name = instrument_name
        self._default_speed = default_speed
        self._flow_rate = FlowRates(self)
        self._plunger_speeds = PlungerSpeeds(self)
        # Cache the maximum instrument height
        self._instrument_max_height = protocol_interface\
            .get_hardware().hardware.get_instrument_max_height(self._mount)

    def get_default_speed(self) -> float:
        return self._default_speed

    def set_default_speed(self, speed: float) -> None:
        self._default_speed = speed

    def aspirate(self, volume: float, rate: float) -> None:
        self._raise_if_no_tip(HardwareAction.ASPIRATE.name)
        new_volume = self.get_current_volume() + volume
        assert new_volume <= self._pipette_dict['working_volume'],\
            "Cannot aspirate more than pipette max volume"
        self._pipette_dict['current_volume'] = new_volume

    def dispense(self, volume: float, rate: float) -> None:
        self._raise_if_no_tip(HardwareAction.DISPENSE.name)
        self._pipette_dict['current_volume'] -= volume

    def blow_out(self) -> None:
        self._raise_if_no_tip(HardwareAction.BLOWOUT.name)
        self._pipette_dict['current_volume'] = 0
        self._pipette_dict['ready_to_aspirate'] = False

    def touch_tip(self, location: WellImplementation, radius: float,
                  v_offset: float, speed: float) -> None:
        pass

    def pick_up_tip(self, well: WellImplementation, tip_length: float,
                    presses: typing.Optional[int],
                    increment: typing.Optional[float]) -> None:
        self._raise_if_tip("drop tip")
        self._pipette_dict['has_tip'] = True
        self._pipette_dict['current_volume'] = 0

    def drop_tip(self, home_after: bool) -> None:
        self._raise_if_no_tip(HardwareAction.DROPTIP.name)
        self._pipette_dict['has_tip'] = False

    def home(self) -> None:
        self._protocol_interface.set_last_location(None)

    def home_plunger(self) -> None:
        pass

    def delay(self) -> None:
        pass

    def move_to(self, location: types.Location, force_direct: bool,
                minimum_z_height: typing.Optional[float],
                speed: typing.Optional[float]) -> None:
        """Simulation of only the motion planning portion of move_to."""
        last_location = self._protocol_interface.get_last_location()
        if last_location:
            from_loc = last_location
        else:
            from_loc = types.Location(types.Point(0, 0, 0), LabwareLike(None))

        # We just want to catch planning errors.
        planning.plan_moves(from_loc,
                            location,
                            self._protocol_interface.get_deck(),
                            self._instrument_max_height,
                            force_direct=force_direct,
                            minimum_z_height=minimum_z_height)

        self._protocol_interface.set_last_location(location)

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
        self._raise_if_no_tip(HardwareAction.PREPARE_ASPIRATE.name)

    def get_return_height(self) -> float:
        return self._pipette_dict['return_tip_height']

    def get_well_bottom_clearance(self) -> Clearances:
        return Clearances(default_aspirate=1, default_dispense=1)

    def get_speed(self) -> PlungerSpeeds:
        return self._plunger_speeds

    def get_flow_rate(self) -> FlowRates:
        return self._flow_rate

    def set_flow_rate(self, aspirate: typing.Optional[float] = None,
                      dispense: typing.Optional[float] = None,
                      blow_out: typing.Optional[float] = None) -> None:
        if aspirate is not None:
            self._pipette_dict['aspirate_flow_rate'] = aspirate
        if dispense is not None:
            self._pipette_dict['dispense_flow_rate'] = dispense
        if blow_out is not None:
            self._pipette_dict['blow_out_flow_rate'] = blow_out

    def set_pipette_speed(self, aspirate: typing.Optional[float] = None,
                          dispense: typing.Optional[float] = None,
                          blow_out: typing.Optional[float] = None) -> None:
        if aspirate is not None:
            self._pipette_dict['aspirate_speed'] = aspirate
        if dispense is not None:
            self._pipette_dict['dispense_speed'] = dispense
        if blow_out is not None:
            self._pipette_dict['blow_out_speed'] = blow_out

    def _raise_if_no_tip(self, action: str) -> None:
        """Raise NoTipAttachedError if no tip."""
        if not self.has_tip():
            raise NoTipAttachedError(
                f'Cannot perform {action} without a tip attached'
            )

    def _raise_if_tip(self, action: str) -> None:
        """Raise TipAttachedError if tip."""
        if self.has_tip():
            raise TipAttachedError(
                f'Cannot {action} with a tip attached'
            )
