import pytest

from opentrons.types import Point
from opentrons.protocol_api import execute, ProtocolContext


def test_api2_runfunc():
    def noargs():
        pass

    with pytest.raises(SyntaxError):
        execute._runfunc_ok(noargs)

    def twoargs(a, b):
        pass

    with pytest.raises(SyntaxError):
        execute._runfunc_ok(twoargs)

    def two_with_default(a, b=2):
        pass

    assert execute._runfunc_ok(two_with_default) == two_with_default

    def one_with_default(a=2):
        pass

    assert execute._runfunc_ok(one_with_default) == one_with_default

    def starargs(*args):
        pass

    assert execute._runfunc_ok(starargs) == starargs


@pytest.mark.parametrize('protocol_file', ['testosaur_v2.py'])
def test_execute_ok(protocol, protocol_file, ensure_api2, loop):
    proto = compile(protocol.text, protocol.filename, 'exec')
    ctx = ProtocolContext(loop)
    execute.run_protocol(protocol_code=proto, context=ctx)


def test_bad_protocol(ensure_api2, loop):
    ctx = ProtocolContext(loop)
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(protocol_code='print("hi")', context=ctx)
        assert "No function 'run" in str(e)
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(protocol_code='def run(): pass', context=ctx)
        assert "Function 'run()' does not take any parameters" in str(e)
    with pytest.raises(execute.MalformedProtocolError) as e:
        execute.run_protocol(protocol_code='def run(a, b): pass', context=ctx)
        assert "must be called with more than one argument" in str(e)


def test_proto_with_exception(ensure_api2, loop):
    ctx = ProtocolContext(loop)
    exc_in_root = '''
def run(ctx):
    raise Exception("hi")
'''
    comped = compile(exc_in_root, 'test_file.py', 'exec')
    with pytest.raises(execute.ExceptionInProtocolError) as e:
        execute.run_protocol(
            protocol_code=comped,
            context=ctx)
    assert 'Exception [line 3]: hi' in str(e)

    nested_exc = '''
import ast

def this_throws():
    raise Exception("hi")

def run(ctx):
    this_throws()
'''
    comped = compile(nested_exc, 'nested.py', 'exec')
    with pytest.raises(execute.ExceptionInProtocolError) as e:
        execute.run_protocol(
            protocol_code=comped,
            context=ctx)
    assert '[line 5]' in str(e)
    assert 'Exception [line 5]: hi' in str(e)


# TODO Ian 2018-11-07 when `model` is dropped, delete its test case
@pytest.mark.parametrize('protocol_data',
                         [
                             # deprecated case
                             {
                                 "pipettes": {
                                     "leftPipetteHere": {
                                         "mount": "left",
                                         "model": "p10_single_v1.3"
                                     }
                                 }
                             },
                             # future case
                             {
                                 "pipettes": {
                                     "leftPipetteHere": {
                                         "mount": "left",
                                         "name": "p10_single"
                                     }
                                 }
                             }
                         ])
async def test_load_pipettes(loop, protocol_data):

    ctx = ProtocolContext(loop=loop)

    loaded_pipettes = execute.load_pipettes_from_json(ctx, protocol_data)
    assert 'leftPipetteHere' in loaded_pipettes
    assert len(loaded_pipettes) == 1
    pip = loaded_pipettes['leftPipetteHere']
    assert pip.mount == 'left'
    assert ctx.loaded_instruments['left'] == pip


@pytest.mark.parametrize('command_type', ['aspirate', 'dispense'])
def test_get_location_with_offset(loop, command_type):
    ctx = ProtocolContext(loop=loop)
    plate = ctx.load_labware_by_name("generic_96_wellplate_380_ul", 1)
    well = "B2"

    default_values = {
        'aspirate-mm-from-bottom': 2,
        'dispense-mm-from-bottom': 3
    }

    loaded_labware = {
        "someLabwareId": plate
    }

    # test with nonzero and with zero command-specific offset
    for offset in [5, 0]:
        command_params = {
            "labware": "someLabwareId",
            "well": well,
            "offsetFromBottomMm": offset
        }
        offs = execute._get_bottom_offset(
            command_type, command_params, default_values)
        assert offs == offset
        result = execute._get_location_with_offset(
            loaded_labware, command_type, command_params, default_values)
        assert result.labware == plate.wells_by_index()[well]
        assert result.point\
            == plate.wells_by_index()[well].bottom().point + Point(z=offset)

    command_params = {
        "labware": "someLabwareId",
        "well": well
    }

    # no command-specific offset, use default
    result = execute._get_location_with_offset(
        loaded_labware, command_type, command_params, default_values)
    default = default_values['{}-mm-from-bottom'.format(command_type)]
    assert execute._get_bottom_offset(
        command_type, command_params, default_values) == default
    assert result.point\
        == plate.wells_by_index()[well].bottom().point + Point(z=default)


def test_load_labware(loop):
    ctx = ProtocolContext(loop=loop)
    data = {
        "labware": {
            "sourcePlateId": {
              "slot": "10",
              "model": "usa_scientific_12_trough_22_ml",
              "display-name": "Source (Buffer)"
            },
            "destPlateId": {
              "slot": "11",
              "model": "generic_96_wellplate_380_ul",
              "display-name": "Destination Plate"
            },
            "oldPlateId": {
              "slot": "9",
              "model": "96-flat",
              "display-name": "Test Plate"
            },
        }
    }
    loaded_labware = execute.load_labware_from_json(ctx, data)

    # objects in loaded_labware should be same objs as labware objs in the deck
    assert loaded_labware['sourcePlateId'] == ctx.loaded_labwares[10]
    assert 'Source (Buffer)' in str(loaded_labware['sourcePlateId'])
    assert loaded_labware['destPlateId'] == ctx.loaded_labwares[11]
    assert 'Destination Plate' in str(loaded_labware['destPlateId'])
    assert loaded_labware['oldPlateId'].name == 'generic_96_wellplate_380_ul'
    assert 'Test Plate' in str(loaded_labware['oldPlateId'])


def test_load_labware_trash(loop):
    ctx = ProtocolContext(loop=loop)
    data = {
        "labware": {
            "someTrashId": {
                "slot": "12",
                "model": "fixed-trash"
            }
        }
    }
    result = execute.load_labware_from_json(ctx, data)

    assert result['someTrashId'] == ctx.fixed_trash


def test_blank_protocol(loop):
    # Check that this doesn’t throw an exception
    ctx = ProtocolContext(loop=loop)
    execute.run_protocol(protocol_json={}, context=ctx)


protocol_data = {
    "default-values": {
        "aspirate-flow-rate": {
            "p300_single_v1": 101
        },
        "dispense-flow-rate": {
            "p300_single_v1": 102
        }
    },
    "pipettes": {
        "pipetteId": {
            "mount": "left",
            "model": "p300_single_v1"
        }
    },
    "procedure": [
        {
            "subprocedure": [
                {
                    "command": "aspirate",
                    "params": {
                        "pipette": "pipetteId",
                        "labware": "sourcePlateId",
                        "well": "A1",
                        "volume": 5,
                        "flow-rate": 123
                    }
                },
                {
                    "command": "delay",
                    "params": {
                        "wait": 42
                    }
                },
                {
                    "command": "dispense",
                    "params": {
                        "pipette": "pipetteId",
                        "labware": "destPlateId",
                        "well": "B1",
                        "volume": 4.5
                    }
                },
            ]
        }
    ]
}


def test_dispatch_commands(monkeypatch, loop):
    ctx = ProtocolContext(loop=loop)
    cmd = []
    flow_rates = []

    def mock_sleep(minutes=0, seconds=0):
        cmd.append(("sleep", seconds))

    def mock_aspirate(volume, location):
        cmd.append(("aspirate", volume, location))

    def mock_dispense(volume, location):
        cmd.append(("dispense", volume, location))

    def mock_set_flow_rate(mount, aspirate=None, dispense=None):
        flow_rates.append((aspirate, dispense))

    insts = execute.load_pipettes_from_json(ctx, protocol_data)

    source_plate = ctx.load_labware_by_name('generic_96_wellplate_380_ul', '1')
    dest_plate = ctx.load_labware_by_name('generic_96_wellplate_380_ul', '2')

    loaded_labware = {
        'sourcePlateId': source_plate,
        'destPlateId': dest_plate
    }
    pipette = insts['pipetteId']
    monkeypatch.setattr(pipette, 'aspirate', mock_aspirate)
    monkeypatch.setattr(pipette, 'dispense', mock_dispense)
    monkeypatch.setattr(ctx._hw_manager.hardware._api, 'set_flow_rate',
                        mock_set_flow_rate)
    monkeypatch.setattr(ctx, 'delay', mock_sleep)

    execute.dispatch_json(
        ctx, protocol_data, insts, loaded_labware)

    assert cmd == [
        ("aspirate", 5, source_plate.wells_by_index()['A1'].bottom()),
        ("sleep", 42),
        ("dispense", 4.5, dest_plate.wells_by_index()['B1'].bottom())
    ]

    assert flow_rates == [
        (123, 102),
        (101, 102)
    ]
