import logging
from typing import Dict, TYPE_CHECKING

from opentrons.protocol_api.contexts import ProtocolContext, InstrumentContext
from opentrons.protocol_api import labware
from opentrons.types import Point, Location
from opentrons_shared_data.protocol.constants import (
    JsonPipetteCommand, JsonRobotCommand)


if TYPE_CHECKING:
    from opentrons_shared_data.protocol.dev_types import (
        JsonProtocolV3, JsonProtocol,
        PipetteAccessParams, StandardLiquidHandlingParams,
        DelayParams, FlowRateParams, TouchTipParams,
        PipetteAccessWithOffsetParams, BlowoutParams, MoveToSlotParams)
    from opentrons.protocols.execution.dev_types import PipetteDispatch

MODULE_LOG = logging.getLogger(__name__)


def load_pipettes_from_json(
        ctx: ProtocolContext,
        protocol: 'JsonProtocol') -> Dict[str, InstrumentContext]:
    pipette_data = protocol['pipettes']
    pipettes_by_id = {}
    for pipette_id, props in pipette_data.items():
        mount = props['mount']
        name = props['name']
        instr = ctx.load_instrument(name, mount)
        pipettes_by_id[pipette_id] = instr

    return pipettes_by_id


def _get_well(loaded_labware: Dict[str, labware.Labware],
              params: 'PipetteAccessParams') -> labware.Well:
    labwareId = params['labware']
    well = params['well']
    plate = loaded_labware[labwareId]
    return plate[well]


# TODO (Ian 2019-04-05) once Pipette commands allow flow rate as an
# absolute value (not % value) as an argument in
# aspirate/dispense/blowout/air_gap fns, remove this
def _set_flow_rate(
        pipette: InstrumentContext,
        params: 'FlowRateParams') -> None:
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
        protocol: 'JsonProtocolV3') -> Dict[str, labware.Labware]:
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


def _get_location_with_offset(
        loaded_labware: Dict[str, labware.Labware],
        params: 'PipetteAccessWithOffsetParams') -> Location:
    well = _get_well(loaded_labware, params)

    # Never move to the bottom of the fixed trash
    if 'fixedTrash' in labware.quirks_from_any_parent(well):
        return well.top()

    offset_from_bottom = params['offsetFromBottomMm']
    bottom = well.bottom()
    return bottom.move(Point(z=offset_from_bottom))


def _delay(context: ProtocolContext, params: 'DelayParams') -> None:
    wait = params['wait']
    message = params.get('message')
    if wait is None or wait is False:
        raise ValueError('Delay must be true, or a number')
    elif wait is True:
        message = message or 'Pausing until user resumes'
        context.pause(msg=message)
    else:
        context.delay(seconds=wait, msg=message)


def _blowout(instruments: Dict[str, InstrumentContext],
             loaded_labware: Dict[str, labware.Labware],
             params: 'BlowoutParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    well = _get_well(loaded_labware, params)
    _set_flow_rate(pipette, params)
    pipette.blow_out(well)


def _pick_up_tip(instruments: Dict[str, InstrumentContext],
                 loaded_labware: Dict[str, labware.Labware],
                 params: 'PipetteAccessParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    well = _get_well(loaded_labware, params)
    pipette.pick_up_tip(well)


def _drop_tip(instruments: Dict[str, InstrumentContext],
              loaded_labware: Dict[str, labware.Labware],
              params: 'PipetteAccessParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    well = _get_well(loaded_labware, params)
    pipette.drop_tip(well)


def _aspirate(instruments: Dict[str, InstrumentContext],
              loaded_labware: Dict[str, labware.Labware],
              params: 'StandardLiquidHandlingParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    location = _get_location_with_offset(loaded_labware, params)
    volume = params['volume']
    _set_flow_rate(pipette, params)
    pipette.aspirate(volume, location)


def _dispense(instruments: Dict[str, InstrumentContext],
              loaded_labware: Dict[str, labware.Labware],
              params: 'StandardLiquidHandlingParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    location = _get_location_with_offset(loaded_labware, params)
    volume = params['volume']
    _set_flow_rate(pipette, params)
    pipette.dispense(volume, location)


def _air_gap(instruments: Dict[str, InstrumentContext],
             loaded_labware: Dict[str, labware.Labware],
             params: 'StandardLiquidHandlingParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    offset_from_bottom = params['offsetFromBottomMm']
    volume = params['volume']
    _set_flow_rate(pipette, params)
    well = _get_well(loaded_labware, params)
    offset_from_top = offset_from_bottom - well._depth

    # NOTE(IL, 2020-06-25): air_gap API fn is stateful, uses location
    # cache. The JSON atomic command should be stateless. We'll
    # explicitly move_to the specified well to ensure the location
    # cache is set to that well.
    pipette.move_to(well.top(offset_from_top))
    pipette.air_gap(volume, offset_from_top)


def _touch_tip(instruments: Dict[str, InstrumentContext],
               loaded_labware: Dict[str, labware.Labware],
               params: 'TouchTipParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    location = _get_location_with_offset(loaded_labware, params)
    well = _get_well(loaded_labware, params)
    # convert mmFromBottom to v_offset
    v_offset = location.point.z - well.top().point.z
    pipette.touch_tip(well, v_offset=v_offset)


def _move_to_slot(context: ProtocolContext,
                  instruments: Dict[str, InstrumentContext],
                  params: 'MoveToSlotParams') -> None:
    pipette_id = params['pipette']
    pipette = instruments[pipette_id]
    slot = params['slot']
    if slot not in context.deck:
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


dispatcher_map: 'PipetteDispatch' = {
    JsonRobotCommand.delay.value: _delay,
    JsonPipetteCommand.blowout.value: _blowout,
    JsonPipetteCommand.pickUpTip.value: _pick_up_tip,
    JsonPipetteCommand.dropTip.value: _drop_tip,
    JsonPipetteCommand.aspirate.value: _aspirate,
    JsonPipetteCommand.dispense.value: _dispense,
    JsonPipetteCommand.touchTip.value: _touch_tip,
    JsonPipetteCommand.moveToSlot.value: _move_to_slot
}


def dispatch_json(context: ProtocolContext,
                  protocol_data: 'JsonProtocolV3',
                  instruments: Dict[str, InstrumentContext],
                  loaded_labware: Dict[str, labware.Labware]) -> None:
    commands = protocol_data['commands']

    pipette_commands = {
        JsonPipetteCommand.blowout.value,
        JsonPipetteCommand.pickUpTip.value,
        JsonPipetteCommand.dropTip.value,
        JsonPipetteCommand.aspirate.value,
        JsonPipetteCommand.dispense.value,
        JsonPipetteCommand.touchTip.value,
    }

    for command_item in commands:
        command_type = command_item['command']
        params = command_item['params']

        # different `_command` helpers take different args
        if command_type in pipette_commands:
            dispatcher_map[command_type](  # type: ignore
                instruments, loaded_labware, params)  # type: ignore
        elif command_type == JsonRobotCommand.delay.value:
            dispatcher_map[command_type](context, params)  # type: ignore
        elif command_type == JsonPipetteCommand.moveToSlot.value:
            dispatcher_map[command_type](
                context, instruments, params)  # type: ignore
        else:
            raise RuntimeError(
                "Unsupported command type {}".format(command_type))
