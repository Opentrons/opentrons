from .helpers import stringify_location
from . import types as command_types

from typing import Union, Sequence, Optional, TYPE_CHECKING

from opentrons.protocols.api_support.util import FlowRates

if TYPE_CHECKING:
    from opentrons.protocol_api.instrument_context import InstrumentContext
    from opentrons.protocol_api.labware import Well
    from opentrons.types import Location


Apiv2Locations = Sequence[Union['Location', 'Well']]
Apiv2Instruments = Sequence['InstrumentContext']


def combine_locations(location: Sequence) -> str:
    if len(location) > 1:
        loc1 = stringify_location(location[0])
        loc2 = stringify_location(location[1])
        return f'{loc1} and {loc2}'
    elif len(location) == 1:
        loc1 = stringify_location(location[0])
        return f'{loc1}'
    else:
        return ''


def paired_aspirate(
        instruments: Apiv2Instruments, volume: float,
        locations: Apiv2Locations, rate: float,
        pub_type: str) -> command_types.AspirateCommand:
    loc_text = combine_locations(locations)
    flow_rate = min(
        rate * FlowRates(instr._implementation).aspirate
        for instr in instruments)
    text_type = f'{pub_type}: Aspirating '
    text_content = f'{volume} uL from {loc_text} at {flow_rate} uL/sec'
    text = text_type + text_content
    return {
        'name': command_types.ASPIRATE,
        'payload': {
            'instruments': instruments,
            'volume': volume,
            'locations': locations,
            'rate': rate,
            'text': text
        }
    }


def paired_dispense(
        instruments: Apiv2Instruments, volume: float,
        locations: Apiv2Locations, rate: float,
        pub_type: str) -> command_types.DispenseCommand:
    loc_text = combine_locations(locations)
    flow_rate = min(
        rate * FlowRates(instr._implementation).dispense
        for instr in instruments)
    text_type = f'{pub_type}: Dispensing '
    text_content = f'{volume} uL into {loc_text} at {flow_rate} uL/sec'
    text = text_type + text_content
    return {
        'name': command_types.DISPENSE,
        'payload': {
            'instruments': instruments,
            'volume': volume,
            'locations': locations,
            'rate': rate,
            'text': text
        }
    }


def paired_mix(
        instruments: Apiv2Instruments, locations: Optional[Apiv2Locations],
        repetitions: int, volume: float, pub_type: str) -> command_types.MixCommand:
    text_type = f'{pub_type}: Mixing '
    text_content = '{repetitions} times with a volume of {volume} ul'
    text = text_type + text_content
    return {
        'name': command_types.MIX,
        'payload': {
            'instruments': instruments,
            'locations': locations,
            'volume': volume,
            'repetitions': repetitions,
            'text': text
        }
    }


def paired_blow_out(
        instruments: Apiv2Instruments,
        locations: Optional[Apiv2Locations],
        pub_type: str) -> command_types.BlowOutCommand:
    text = f'{pub_type}: Blowing out'

    if locations is not None:
        location_text = combine_locations(locations)
        text += f' at {location_text}'

    return {
        'name': command_types.BLOW_OUT,
        'payload': {
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    }


def paired_touch_tip(
        instruments: Apiv2Instruments,
        locations: Optional[Apiv2Locations],
        pub_type: str) -> command_types.TouchTipCommand:
    text = f'{pub_type}: Touching tip'

    if locations is not None:
        location_text = combine_locations(locations)
        text += f' at {location_text}'
    return {
        'name': command_types.TOUCH_TIP,
        'payload': {
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    }


def air_gap() -> command_types.AirGapCommand:
    text = 'Air gap'
    return {
        'name': command_types.AIR_GAP,
        'payload': {
            'text': text
        }
    }


def return_tip() -> command_types.ReturnTipCommand:
    text = 'Returning tip'
    return {
        'name': command_types.RETURN_TIP,
        'payload': {
            'text': text
        }
    }


def paired_pick_up_tip(
        instruments: Apiv2Instruments,
        locations: Apiv2Locations, pub_type: str) -> command_types.PickUpTipCommand:
    location_text = combine_locations(locations)
    text = f'{pub_type}: Picking up tip from {location_text}'
    return {
        'name': command_types.PICK_UP_TIP,
        'payload': {
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    }


def paired_drop_tip(
        instruments: Apiv2Instruments,
        locations: Apiv2Locations, pub_type: str) -> command_types.DropTipCommand:
    location_text = combine_locations(locations)
    text = f'{pub_type}: Dropping tip into {location_text}'
    return {
        'name': command_types.DROP_TIP,
        'payload': {
            'instruments': instruments,
            'locations': locations,
            'text': text
        }
    }
