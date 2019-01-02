import inspect
import itertools
import logging
import os
import traceback
import sys
from typing import Any, Callable, Dict

from .contexts import ProtocolContext, InstrumentContext
from . import labware
from opentrons.types import Point

MODULE_LOG = logging.getLogger(__name__)

PROTOCOL_MALFORMED = """

A Python protocol for the OT2 must define a function called 'run' that takes a
single argument: the protocol context to call functions on. For instance, a run
function might look like this:

def run(ctx):
    ctx.comment('hello, world')

This function is called by the robot when the robot executes the protol.
This function is not present in the current protocol and must be added.
"""


class ExceptionInProtocolError(Exception):
    """ This exception wraps an exception that was raised from a protocol
    for proper error message formatting by the rpc, since it's only here that
    we can properly figure out formatting
    """
    def __init__(self, original_exc, original_tb, message, line):
        self.original_exc = original_exc
        self.original_tb = original_tb
        self.message = message
        self.line = line
        super().__init__(original_exc, original_tb, message, line)

    def __str__(self):
        return '{}{}: {}'.format(
            self.original_exc.__class__.__name__,
            ' [line {}]'.format(self.line) if self.line else '',
            self.message)


class MalformedProtocolError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(message)

    def __str__(self):
        return self._msg + PROTOCOL_MALFORMED

    def __repr__(self):
        return '<{}: {}>'.format(self.__class__.__name__, self.message)


def _runfunc_ok(run_func: Any) -> Callable[[ProtocolContext], None]:
    if not callable(run_func):
        raise SyntaxError("No function 'run(ctx)' defined")
    sig = inspect.Signature.from_callable(run_func)
    if not sig.parameters:
        raise SyntaxError("Function 'run()' does not take any parameters")
    if len(sig.parameters) > 1:
        for name, param in list(sig.parameters.items())[1:]:
            if param.default == inspect.Parameter.empty:
                raise SyntaxError(
                    "Function 'run{}' must be called with more than one "
                    "argument but would be called as 'run(ctx)'"
                    .format(str(sig)))
    return run_func  # type: ignore


def _find_protocol_error(tb, proto_name):
    """Return the FrameInfo for the lowest frame in the traceback from the
    protocol.
    """
    tb_info = traceback.extract_tb(tb)
    for frame in reversed(tb_info):
        if frame.filename == proto_name:
            return frame
    else:
        raise KeyError


def _run_python(proto: Any, context: ProtocolContext):
    new_locs = locals()
    new_globs = globals()
    name = getattr(proto, 'co_filename', '<protocol>')
    exec(proto, new_globs, new_locs)
    # If the protocol is written correctly, it will have defined a function
    # like run(context: ProtocolContext). If so, that function is now in the
    # current scope.
    try:
        _runfunc_ok(new_locs.get('run'))
    except SyntaxError as se:
        raise MalformedProtocolError(str(se))
    new_globs.update(new_locs)
    try:
        exec('run(context)', new_globs, new_locs)
    except Exception as e:
        exc_type, exc_value, tb = sys.exc_info()
        try:
            frame = _find_protocol_error(tb, name)
        except KeyError:
            # No pretty names, just raise it
            raise e
        raise ExceptionInProtocolError(e, tb, str(e), frame.lineno)


def load_pipettes_from_json(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any]) -> Dict[str, InstrumentContext]:
    pipette_data = protocol.get('pipettes', {})
    pipettes_by_id = {}
    for pipette_id, props in pipette_data.items():
        model = props.get('model')
        mount = props.get('mount')

        # TODO: Ian 2018-11-06 remove this fallback to 'model' when
        # backwards-compatability for JSON protocols with versioned
        # pipettes is dropped (next JSON protocol schema major bump)
        name = props.get('name')
        if not name:
            name = model.split('_v')[0]

        instr = ctx.load_instrument(name, mount)

        pipettes_by_id[pipette_id] = instr

    return pipettes_by_id


def load_labware_from_json(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any]) -> Dict[str, labware.Labware]:
    data = protocol.get('labware', {})
    loaded_labware = {}
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
                    .format(labware_id))
        else:
            labware_def = labware.load_definition_by_name(model)

            # Patch in the user-specified display name
            display_name = props.get('display-name')
            if display_name:
                labware_def['metadata']['displayName'] = display_name
            labware_obj = labware.load_from_definition(
                labware_def, ctx.deck.position_for(slot))
            loaded_labware[labware_id] = ctx.load_labware(labware_obj,
                                                          slot)

    return loaded_labware


def _get_location(loaded_labware, command_type, params, default_values):
    labwareId = params.get('labware')
    if not labwareId:
        # not all commands use labware param
        return None
    well = params.get('well')
    plate = loaded_labware.get(labwareId)
    if not plate:
        raise ValueError(
            'Command tried to use labware "{}", but that ID does not exist '
            'in protocol\'s "labware" section'.format(labwareId))

    # default offset from bottom for aspirate/dispense commands
    offset_default = default_values.get(
        '{}-mm-from-bottom'.format(command_type))

    # optional command-specific value, fallback to default
    offset_from_bottom = params.get(
        'offsetFromBottomMm', offset_default)

    if offset_from_bottom is None:
        # not all commands use offsets

        # touch-tip uses offset from top, not bottom, as default
        # when offsetFromBottomMm command-specific value is unset
        if command_type == 'touch-tip':
            # TODO: Ian 2018-10-29 remove this `-1` when
            # touch-tip-mm-from-top is a required field
            return plate.wells_by_index()[well].top().move(
                Point(z=default_values.get('touch-tip-mm-from-top', -1)))

        return plate.wells_by_index()[well]

    return plate.wells_by_index()[well].bottom()\
                                       .move(Point(z=offset_from_bottom))


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


def dispatch_json(context: ProtocolContext,  # noqa(C901)
                  protocol_data: Dict[Any, Any],
                  instruments: Dict[str, InstrumentContext],
                  labware: Dict[str, labware.Labware]):
    subprocedures = [
        p.get('subprocedure', [])
        for p in protocol_data.get('procedure', [])]

    default_values = protocol_data.get('default-values', {})
    flat_subs = itertools.chain.from_iterable(subprocedures)

    for command_item in flat_subs:
        command_type = command_item.get('command')
        params = command_item.get('params', {})
        pipette = instruments.get(params.get('pipette'))
        protocol_pipette_data = protocol_data\
            .get('pipettes', {})\
            .get(params.get('pipette'), {})
        pipette_name = protocol_pipette_data.get('name')

        if (not pipette_name):
            # TODO: Ian 2018-11-06 remove this fallback to 'model' when
            # backwards-compatability for JSON protocols with versioned
            # pipettes is dropped (next JSON protocol schema major bump)
            pipette_name = protocol_pipette_data.get('model')

        location = _get_location(labware, command_type, params, default_values)
        volume = params.get('volume')

        if pipette:
            # Aspirate/Dispense flow rate must be set each time for commands
            # which use pipettes right now.
            # Flow rate is persisted inside the Pipette object
            # and is settable but not easily gettable
            _set_flow_rate(
                pipette_name, pipette, command_type, params, default_values)

        if command_type == 'delay':
            wait = params.get('wait')
            if wait is None:
                raise ValueError('Delay cannot be null')
            elif wait is True:
                message = params.get('message', 'Pausing until user resumes')
                context.pause(msg=message)
            else:
                context.delay(seconds=wait)

        elif command_type == 'blowout':
            pipette.blow_out(location)  # type: ignore

        elif command_type == 'pick-up-tip':
            pipette.pick_up_tip(location)  # type: ignore

        elif command_type == 'drop-tip':
            pipette.drop_tip(location)  # type: ignore

        elif command_type == 'aspirate':
            pipette.aspirate(volume, location)  # type: ignore

        elif command_type == 'dispense':
            pipette.dispense(volume, location)  # type: ignore

        elif command_type == 'touch-tip':
            # NOTE: if touch_tip can take a location tuple,
            # this can be much simpler
            (well_object, loc_tuple) = location

            # Use the offset baked into the well_object.
            # Do not allow API to apply its v_offset kwarg default value,
            # and do not apply the JSON protocol's default offset.
            z_from_bottom = loc_tuple[2]
            offset_from_top = (
                well_object.properties['depth'] - z_from_bottom) * -1

            pipette.touch_tip(  # type: ignore
                well_object, v_offset=offset_from_top)


def run_protocol(protocol_code: Any = None,
                 protocol_json: Dict[Any, Any] = None,
                 simulate: bool = False,
                 context: ProtocolContext = None):
    """ Create a ProtocolRunner instance from one of a variety of protocol
    sources.

    :param protocol_bytes: If the protocol is a Python protocol, pass the
    file contents here.
    :param protocol_json: If the protocol is a json file, pass the contents
    here.
    :param simulate: True to simulate; False to execute. If this is not an
    OT2, ``simulate`` will be forced ``True``.
    :param context: The context to use. If ``None``, create a new
    ProtocolContext.
    """
    if not os.environ.get('RUNNING_ON_PI'):
        simulate = True # noqa - will be used later
    if None is context and simulate:
        true_context = ProtocolContext()
        true_context.home()
        MODULE_LOG.info("Generating blank protocol context for simulate")
    elif context:
        true_context = context
    else:
        raise RuntimeError(
            'Will not automatically generate hardware controller')
    if None is not protocol_code:
        _run_python(protocol_code, true_context)
    elif None is not protocol_json:
        lw = load_labware_from_json(true_context, protocol_json)
        ins = load_pipettes_from_json(true_context, protocol_json)
        dispatch_json(true_context, protocol_json, ins, lw)
    else:
        raise RuntimeError("run_protocol must have either code or json")
