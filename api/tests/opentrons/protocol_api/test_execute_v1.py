import os
import json
import pytest
from opentrons.types import Point
from opentrons.protocol_api import execute_v1, ProtocolContext


# TODO Ian 2018-11-07 when `model` is dropped, delete its test case
@pytest.mark.parametrize('protocol_data',
                         [
                             # no name, use model
                             {
                                 "pipettes": {
                                     "leftPipetteHere": {
                                         "mount": "left",
                                         "model": "p10_single_v1.3"
                                     }
                                 }
                             },
                             # name over model
                             {
                                 "pipettes": {
                                     "leftPipetteHere": {
                                         "mount": "left",
                                         "model": "ignore this!!!",
                                         "name": "p10_single"
                                     }
                                 }
                             }
                         ])
async def test_load_pipettes(loop, protocol_data):

    ctx = ProtocolContext(loop=loop)

    loaded_pipettes = execute_v1.load_pipettes_from_json(ctx, protocol_data)
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
        offs = execute_v1._get_bottom_offset(
            command_type, command_params, default_values)
        assert offs == offset
        result = execute_v1._get_location_with_offset(
            loaded_labware, command_type, command_params, default_values)
        assert result.labware == plate.wells_by_index()[well]
        assert result.point\
            == plate.wells_by_index()[well].bottom().point + Point(z=offset)

    command_params = {
        "labware": "someLabwareId",
        "well": well
    }

    # no command-specific offset, use default
    result = execute_v1._get_location_with_offset(
        loaded_labware, command_type, command_params, default_values)
    default = default_values['{}-mm-from-bottom'.format(command_type)]
    assert execute_v1._get_bottom_offset(
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
    loaded_labware = execute_v1.load_labware_from_json_loadnames(ctx, data)

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
    result = execute_v1.load_labware_from_json_loadnames(ctx, data)

    assert result['someTrashId'] == ctx.fixed_trash


def test_dispatch_commands(monkeypatch, loop):
    with open(os.path.join(os.path.dirname(__file__), 'data',
              'v1_json_dispatch.json'), 'r') as f:
        protocol_data = json.load(f)
    ctx = ProtocolContext(loop=loop)
    cmd = []
    flow_rates = []

    def mock_sleep(minutes=0, seconds=0, msg=None):
        cmd.append(("sleep", minutes * 60 + seconds))

    def mock_aspirate(volume, location):
        cmd.append(("aspirate", volume, location))

    def mock_dispense(volume, location):
        cmd.append(("dispense", volume, location))

    def mock_set_flow_rate(mount, aspirate=None, dispense=None):
        flow_rates.append((aspirate, dispense))

    insts = execute_v1.load_pipettes_from_json(ctx, protocol_data)

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

    execute_v1.dispatch_json(
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
