import logging
from typing import Any, Dict

from .contexts import ProtocolContext, InstrumentContext
from . import labware
from opentrons.types import Point, Location

MODULE_LOG = logging.getLogger(__name__)


def load_pipettes_from_json(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any]) -> Dict[str, InstrumentContext]:
    pipette_data = protocol['pipettes']
    pipettes_by_id = {}
    for pipette_id, props in pipette_data.items():
        mount = props['mount']
        name = props['name']
        instr = ctx.load_instrument(name, mount)
        pipettes_by_id[pipette_id] = instr

    return pipettes_by_id


def _get_well(loaded_labware: Dict[str, labware.Labware],
              params: Dict[str, Any]) -> labware.Well:
    labwareId = params['labware']
    well = params['well']
    plate = loaded_labware[labwareId]
    return plate[well]


# TODO (Ian 2019-04-05) once Pipette commands allow flow rate as an
# absolute value (not % value) as an argument in
# aspirate/dispense/blowout/air_gap fns, remove this
def _set_flow_rate(pipette, params) -> None:
    """
    Set flow rate in uL/mm, to value obtained from command's params.
    """
    flow_rate_param = params['flowRate']

    if not (flow_rate_param > 0):
        raise RuntimeError('Positive flowRate param required')

    pipette.flow_rate.aspirate = flow_rate_param
    pipette.flow_rate.dispense = flow_rate_param
    pipette.flow_rate.blow_out = flow_rate_param


def load_labware_from_json_defs(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any]) -> Dict[str, labware.Labware]:
    protocol_labware = protocol['labware']
    definitions = protocol['labwareDefinitions']
    loaded_labware = {}

    for labware_id, props in protocol_labware.items():
        slot = props['slot']
        definition = definitions[props['definitionId']]
        label = props.get('displayName', None)
        loaded_labware[labware_id] = ctx.load_labware_from_definition(
            definition, slot, label)

    return loaded_labware


def _get_location_with_offset(loaded_labware: Dict[str, labware.Labware],
                              params: Dict[str, Any]) -> Location:
    well = _get_well(loaded_labware, params)

    # Never move to the bottom of the fixed trash
    if 'fixedTrash' in labware.quirks_from_any_parent(well):
        return well.top()

    offset_from_bottom = params['offsetFromBottomMm']
    bottom = well.bottom()
    return bottom.move(Point(z=offset_from_bottom))


def _delay(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    wait = params['wait']
    message = params.get('message')
    if wait is None or wait is False:
        raise ValueError('Delay must be true, or a number')
    elif wait is True:
        message = message or 'Pausing until user resumes'
        context.pause(msg=message)
    else:
        context.delay(seconds=wait, msg=message)


def _blowout(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    well = _get_well(loaded_labware, params)
    _set_flow_rate(pipette, params)
    pipette.blow_out(well)


def _pick_up_tip(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    well = _get_well(loaded_labware, params)
    pipette.pick_up_tip(well)


def _drop_tip(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    well = _get_well(loaded_labware, params)
    pipette.drop_tip(well)


def _aspirate(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    location = _get_location_with_offset(loaded_labware, params)
    volume = params['volume']
    _set_flow_rate(pipette, params)
    pipette.aspirate(volume, location)


def _dispense(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    location = _get_location_with_offset(loaded_labware, params)
    volume = params['volume']
    _set_flow_rate(pipette, params)
    pipette.dispense(volume, location)


def _touch_tip(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    location = _get_location_with_offset(loaded_labware, params)
    well = _get_well(loaded_labware, params)
    # convert mmFromBottom to v_offset
    v_offset = location.point.z - well.top().point.z
    pipette.touch_tip(well, v_offset=v_offset)


def _move_to_slot(
        context, protocol_data, instruments, loaded_labware, params) -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    slot = params['slot']
    if slot not in [str(s+1) for s in range(12)]:
        raise ValueError('Invalid "slot" for "moveToSlot": {}'
                         .format(slot))
    slot_obj = context.deck.position_for(slot)

    offset = params.get('offset', {})
    offsetPoint = Point(
        offset.get('x', 0),
        offset.get('y', 0),
        offset.get('z', 0))

    pipette.move_to(
        slot_obj.move(offsetPoint),
        force_direct=params.get('forceDirect'),
        minimum_z_height=params.get('minimumZHeight'))


def dispatch_json(context: ProtocolContext,
                  protocol_data: Dict[Any, Any],
                  instruments: Dict[str, InstrumentContext],
                  loaded_labware: Dict[str, labware.Labware]) -> None:
    commands = protocol_data['commands']
    dispatcher_map = {
        "delay": _delay,
        "blowout": _blowout,
        "pickUpTip": _pick_up_tip,
        "dropTip": _drop_tip,
        "aspirate": _aspirate,
        "dispense": _dispense,
        "touchTip": _touch_tip,
        "moveToSlot": _move_to_slot
    }
    for command_item in commands:
        command_type = command_item['command']
        params = command_item['params']

        if command_type not in dispatcher_map:
            raise RuntimeError(
                "Unsupported command type {}".format(command_type))
        dispatcher_map[command_type](
            context, protocol_data, instruments, loaded_labware, params)
