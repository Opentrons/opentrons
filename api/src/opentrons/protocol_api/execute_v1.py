# execute v1 and v2 protocols
import itertools
import logging
from typing import Any, Dict, Optional

from .contexts import ProtocolContext, InstrumentContext
from .back_compat import BCLabware
from . import labware
from opentrons.types import Point, Location

MODULE_LOG = logging.getLogger(__name__)


def load_pipettes_from_json(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any]) -> Dict[str, InstrumentContext]:
    pipette_data = protocol['pipettes']
    pipettes_by_id = {}
    for pipette_id, props in pipette_data.items():
        model = props['model']
        mount = props['mount']

        # NOTE: 'name' is only used by v1 and v2 JSON protocols
        name = props.get('name')
        if not name:
            name = model.split('_v')[0]

        instr = ctx.load_instrument(name, mount)

        pipettes_by_id[pipette_id] = instr

    return pipettes_by_id


def _get_well(loaded_labware: Dict[str, labware.Labware],
              params: Dict[str, Any]):
    labwareId = params['labware']
    well = params['well']
    plate = loaded_labware.get(labwareId)
    if not plate:
        raise ValueError(
            'Command tried to use labware "{}", but that ID does not exist '
            'in protocol\'s "labware" section'.format(labwareId))
    return plate.wells_by_index()[well]


# TODO (Ian 2018-08-22) once Pipette has more sensible way of managing
# flow rate value (eg as an argument in aspirate/dispense fns), remove this
def _set_flow_rate(
        pipette_name, pipette, command_type, params, default_values):
    """
    Set flow rate in uL/mm, to value obtained from command's params,
    or if unspecified in command params, then from protocol's "default-values".
    """
    default_aspirate = default_values.get(
        'aspirate-flow-rate', {}).get(pipette_name)

    default_dispense = default_values.get(
        'dispense-flow-rate', {}).get(pipette_name)

    flow_rate_param = params.get('flow-rate')

    if flow_rate_param is not None:
        if command_type == 'aspirate':
            pipette.flow_rate = {
                'aspirate': flow_rate_param,
                'dispense': default_dispense
            }
            return
        if command_type == 'dispense':
            pipette.flow_rate = {
                'aspirate': default_aspirate,
                'dispense': flow_rate_param
            }
            return

    pipette.flow_rate = {
        'aspirate': default_aspirate,
        'dispense': default_dispense
    }


def load_labware_from_json_loadnames(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any]) -> Dict[str, labware.Labware]:
    # NOTE: this is only used by v1 and v2 JSON protocols
    data = protocol.get('labware', {})
    loaded_labware = {}
    bc = BCLabware(ctx)
    for labware_id, props in data.items():
        slot = props.get('slot')
        model = props.get('model')
        if slot == '12':
            if model == 'fixed-trash':
                # pass in the pre-existing fixed-trash
                loaded_labware[labware_id] = ctx.fixed_trash
            else:
                raise RuntimeError(
                    "Nothing but the fixed trash may be loaded in slot 12; "
                    "this protocol attempts to load a {} there."
                    .format(model))
        else:
            loaded_labware[labware_id] = bc.load(
                model, slot, label=props.get('display-name'))

    return loaded_labware


def _get_bottom_offset(command_type: str,
                       params: Dict[str, Any],
                       default_values: Dict[str, float]) -> Optional[float]:
    # default offset from bottom for aspirate/dispense commands
    offset_default = default_values.get(
        '{}-mm-from-bottom'.format(command_type))

    # optional command-specific value, fallback to default
    offset_from_bottom = params.get(
        'offsetFromBottomMm', offset_default)

    return offset_from_bottom


def _get_location_with_offset(loaded_labware: Dict[str, labware.Labware],
                              command_type: str,
                              params: Dict[str, Any],
                              default_values: Dict[str, float]) -> Location:
    well = _get_well(loaded_labware, params)

    # Never move to the bottom of the fixed trash
    if 'fixedTrash' in labware.quirks_from_any_parent(well):
        return well.top()

    offset_from_bottom = _get_bottom_offset(
        command_type, params, default_values)

    bot = well.bottom()
    if offset_from_bottom:
        with_offs = bot.move(Point(z=offset_from_bottom))
    else:
        with_offs = bot
    MODULE_LOG.debug("offset from bottom for {}: {}->{}"
                     .format(command_type, bot, with_offs))
    return with_offs


def dispatch_json(context: ProtocolContext,  # noqa(C901)
                     protocol_data: Dict[Any, Any],
                     instruments: Dict[str, InstrumentContext],
                     loaded_labware: Dict[str, labware.Labware]):
    subprocedures = [
        p['subprocedure']
        for p in protocol_data['procedure']]

    default_values = protocol_data['default-values']
    flat_subs = itertools.chain.from_iterable(subprocedures)

    for command_item in flat_subs:
        command_type = command_item['command']
        params = command_item['params']
        pipette = instruments.get(params.get('pipette'))
        protocol_pipette_data = protocol_data['pipettes'].get(
            params.get('pipette'), {})
        pipette_name = protocol_pipette_data.get('name')

        if not pipette_name:
            # TODO: Ian 2018-11-06 remove this fallback to 'model' when
            # backwards-compatability for JSON protocols with versioned
            # pipettes is dropped (next JSON protocol schema major bump)
            pipette_name = protocol_pipette_data.get('model')

        if command_type == 'delay':
            wait = params['wait']
            message = params.get('message')
            if wait is None:
                raise ValueError('Delay cannot be null')
            elif wait is True:
                message = message or 'Pausing until user resumes'
                context.pause(msg=message)
            else:
                context.delay(seconds=wait, msg=message)

        elif command_type == 'blowout':
            well = _get_well(loaded_labware, params)
            pipette.blow_out(well)  # type: ignore

        elif command_type == 'pick-up-tip':
            well = _get_well(loaded_labware, params)
            pipette.pick_up_tip(well)  # type: ignore

        elif command_type == 'drop-tip':
            well = _get_well(loaded_labware, params)
            pipette.drop_tip(well)  # type: ignore

        elif command_type == 'aspirate':
            location = _get_location_with_offset(
                loaded_labware, 'aspirate', params, default_values)
            volume = params['volume']
            _set_flow_rate(
                pipette_name, pipette, command_type, params, default_values)
            pipette.aspirate(volume, location)  # type: ignore

        elif command_type == 'dispense':
            location = _get_location_with_offset(
                loaded_labware, 'dispense', params, default_values)
            volume = params['volume']
            _set_flow_rate(
                pipette_name, pipette, command_type, params, default_values)
            pipette.dispense(volume, location)  # type: ignore

        elif command_type == 'touch-tip':
            well = _get_well(loaded_labware, params)
            offset = default_values.get('touch-tip-mm-from-top', -1)
            pipette.touch_tip(well, v_offset=offset)  # type: ignore

        elif command_type == 'move-to-slot':
            slot = params['slot']
            slot_obj = context.deck.position_for(slot)

            offset = params.get('offset', {})
            offsetPoint = Point(
                offset.get('x', 0),
                offset.get('y', 0),
                offset.get('z', 0))

            pipette.move_to(  # type: ignore
                slot_obj.move(offsetPoint),
                force_direct=params.get('force-direct'),
                minimum_z_height=params.get('minimum-z-height'))
        else:
            raise RuntimeError(
                "Unsupported command type {}".format(command_type))
