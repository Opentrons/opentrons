from __future__ import annotations

from .helpers import make_command, stringify_location, listify
from . import types as command_types

from opentrons.protocols.api_support.util import FlowRates


def home(mount):
    text = 'Homing pipette plunger on mount {mount}'.format(mount=mount)
    return make_command(
        name=command_types.HOME,
        payload={
            'axis': mount,
            'text': text
        }
    )


def aspirate(instrument, volume, location, rate):
    location_text = stringify_location(location)
    template = 'Aspirating {volume} uL from {location} at {flow} uL/sec'
    try:
        flow_rate = rate * FlowRates(instrument).aspirate
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)
    except AttributeError:
        flow_mms = instrument.speeds['aspirate']
        flow_ulsec = flow_mms * instrument._ul_per_mm(instrument.max_volume,
                                                      'aspirate')
        flow_rate = rate * flow_ulsec
        flow_rate = round(flow_rate, 1)
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)

    return make_command(
        name=command_types.ASPIRATE,
        payload={
            'instrument': instrument,
            'volume': volume,
            'location': location,
            'rate': rate,
            'text': text
        }
    )


def dispense(instrument, volume, location, rate):
    location_text = stringify_location(location)
    template = 'Dispensing {volume} uL into {location} at {flow} uL/sec'
    try:
        flow_rate = rate * FlowRates(instrument).dispense
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)
    except AttributeError:
        flow_mms = instrument.speeds['dispense']
        flow_ulsec = flow_mms * instrument._ul_per_mm(instrument.max_volume,
                                                      'dispense')
        flow_rate = rate * flow_ulsec
        flow_rate = round(flow_rate, 1)
        text = template.format(
                volume=float(volume), location=location_text, flow=flow_rate)

    return make_command(
        name=command_types.DISPENSE,
        payload={
            'instrument': instrument,
            'volume': volume,
            'location': location,
            'rate': rate,
            'text': text
        }
    )


def consolidate(instrument, volume, source, dest):
    text = 'Consolidating {volume} from {source} to {dest}'.format(
        volume=transform_volumes(volume),
        source=stringify_location(source),
        dest=stringify_location(dest)
    )
    locations = [] + listify(source) + listify(dest)
    return make_command(
        name=command_types.CONSOLIDATE,
        payload={
            'instrument': instrument,
            'locations': locations,
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def distribute(instrument, volume, source, dest):
    text = 'Distributing {volume} from {source} to {dest}'.format(
        volume=transform_volumes(volume),
        source=stringify_location(source),
        dest=stringify_location(dest)
    )
    locations = [] + listify(source) + listify(dest)
    return make_command(
        name=command_types.DISTRIBUTE,
        payload={
            'instrument': instrument,
            'locations': locations,
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def transfer(instrument, volume, source, dest):
    text = 'Transferring {volume} from {source} to {dest}'.format(
        volume=transform_volumes(volume),
        source=stringify_location(source),
        dest=stringify_location(dest)
    )
    locations = [] + listify(source) + listify(dest)
    return make_command(
        name=command_types.TRANSFER,
        payload={
            'instrument': instrument,
            'locations': locations,
            'volume': volume,
            'source': source,
            'dest': dest,
            'text': text
        }
    )


def transform_volumes(volumes):
    if not isinstance(volumes, list):
        return float(volumes)
    else:
        return [float(vol) for vol in volumes]


def mix(instrument, repetitions, volume, location):
    text = 'Mixing {repetitions} times with a volume of {volume} ul'.format(
        repetitions=repetitions, volume=float(volume)
    )
    return make_command(
        name=command_types.MIX,
        payload={
            'instrument': instrument,
            'location': location,
            'volume': volume,
            'repetitions': repetitions,
            'text': text
        }
    )


def blow_out(instrument, location):
    location_text = stringify_location(location)
    text = 'Blowing out'

    if location is not None:
        text += ' at {location}'.format(location=location_text)

    return make_command(
        name=command_types.BLOW_OUT,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def touch_tip(instrument):
    text = 'Touching tip'

    return make_command(
        name=command_types.TOUCH_TIP,
        payload={
            'instrument': instrument,
            'text': text
        }
    )


def air_gap():
    text = 'Air gap'
    return make_command(
        name=command_types.AIR_GAP,
        payload={
            'text': text
        }
    )


def return_tip():
    text = 'Returning tip'
    return make_command(
        name=command_types.RETURN_TIP,
        payload={
            'text': text
        }
    )


def pick_up_tip(instrument, location):
    location_text = stringify_location(location)
    text = 'Picking up tip from {location}'.format(location=location_text)
    return make_command(
        name=command_types.PICK_UP_TIP,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )


def drop_tip(instrument, location):
    location_text = stringify_location(location)
    text = 'Dropping tip into {location}'.format(location=location_text)
    return make_command(
        name=command_types.DROP_TIP,
        payload={
            'instrument': instrument,
            'location': location,
            'text': text
        }
    )
