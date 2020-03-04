from opentrons.types import Point
from opentrons.protocol_api import execute_v3, ProtocolContext, InstrumentContext, execute
from opentrons.protocols.parse import parse
from unittest import mock


def test_load_labware_v2(loop, get_labware_fixture):
    ctx = ProtocolContext(loop=loop)
    custom_trough_def = get_labware_fixture('fixture_12_trough')
    data = {
        "labwareDefinitions": {
            "someTroughDef": custom_trough_def
        },
        "labware": {
            "sourcePlateId": {
                "slot": "10",
                "definitionId": "someTroughDef",
                "displayName": "Source (Buffer)"
            },
            "destPlateId": {
                "slot": "11",
                "definitionId": "someTroughDef"
            },
        }
    }
    loaded_labware = execute_v3.load_labware_from_json_defs(ctx, data)

    # objects in loaded_labware should be same objs as labware objs in the deck
    assert loaded_labware['sourcePlateId'] == ctx.loaded_labwares[10]
    # use the displayName from protocol's labware.labwareId.displayName
    assert 'Source (Buffer)' in str(loaded_labware['sourcePlateId'])
    assert loaded_labware['destPlateId'] == ctx.loaded_labwares[11]
    # use the metadata.displayName from embedded def
    assert (custom_trough_def['metadata']['displayName'] in
            str(loaded_labware['destPlateId']))


def make_setter_mock(mockInstance):
    def setter_mock(*args, **kwargs):
        if args:
            # if no args, it's not a setter
            mockInstance(*args, **kwargs)
    return setter_mock


def test_dispatch_commands(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture('3', 'simple')
    # a single mock tracks the sequence of all calls we care about
    mock_everything = mock.Mock()

    # nest calls under 'pipetteId' fake method of mock_everything
    mock_pipette = mock.create_autospec(InstrumentContext)
    mock_everything.pipetteId = mock_pipette

    # add fake setter methods for `call` and set up flow_rate setter spies :(
    mock_pipette._mock_set_aspirate_flow_rate = mock.Mock()
    mock_pipette._mock_set_dispense_flow_rate = mock.Mock()
    mock_pipette._mock_set_blow_out_flow_rate = mock.Mock()
    type(mock_pipette.flow_rate).aspirate = mock.PropertyMock(
        side_effect=make_setter_mock(mock_pipette._mock_set_aspirate_flow_rate))
    type(mock_pipette.flow_rate).dispense = mock.PropertyMock(
        side_effect=make_setter_mock(mock_pipette._mock_set_dispense_flow_rate))
    type(mock_pipette.flow_rate).blow_out = mock.PropertyMock(
        side_effect=make_setter_mock(mock_pipette._mock_set_blow_out_flow_rate))

    insts = {"pipetteId": mock_pipette}

    # monkeypatch ProtocolContext methods we need to spy on using the mock
    # next calls under 'ctx' fake method of mock_everything
    ctx = ProtocolContext(loop=loop)
    monkeypatch.setattr(ctx, 'pause', mock_everything.ctx.pause)
    monkeypatch.setattr(ctx, 'delay', mock_everything.ctx.delay)

    source_plate = ctx.load_labware(
        'corning_96_wellplate_360ul_flat', '1')
    dest_plate = ctx.load_labware(
        'corning_96_wellplate_360ul_flat', '2')
    tiprack = ctx.load_labware('opentrons_96_tiprack_10ul', '3')

    loaded_labware = {
        'sourcePlateId': source_plate,
        'destPlateId': dest_plate,
        'tiprackId': tiprack,
        'trashId': ctx.fixed_trash
    }

    execute_v3.dispatch_json(
        ctx, protocol_data, insts, loaded_labware)

    calls = [
        mock.call.pipetteId.pick_up_tip(tiprack['B1']),
        mock.call.pipetteId._mock_set_aspirate_flow_rate(3),
        mock.call.pipetteId._mock_set_dispense_flow_rate(3),
        mock.call.pipetteId._mock_set_blow_out_flow_rate(3),
        mock.call.pipetteId.aspirate(5, source_plate['A1'].bottom(2)),
        mock.call.ctx.delay(msg=None, seconds=42),
        mock.call.pipetteId._mock_set_aspirate_flow_rate(2.5),
        mock.call.pipetteId._mock_set_dispense_flow_rate(2.5),
        mock.call.pipetteId._mock_set_blow_out_flow_rate(2.5),
        mock.call.pipetteId.dispense(4.5, dest_plate['B1'].bottom(1)),
        mock.call.pipetteId.touch_tip(
            dest_plate['B1'], v_offset=0.33000000000000007),
        mock.call.pipetteId._mock_set_aspirate_flow_rate(2),
        mock.call.pipetteId._mock_set_dispense_flow_rate(2),
        mock.call.pipetteId._mock_set_blow_out_flow_rate(2),
        mock.call.pipetteId.blow_out(dest_plate['B1']),
        mock.call.pipetteId.move_to(ctx.deck.position_for('5').move(Point(x=1, y=2, z=3)),
                                    force_direct=None, minimum_z_height=None),
        mock.call.pipetteId.drop_tip(ctx.fixed_trash['A1'],)
    ]

    assert mock_everything.mock_calls == calls


def test_papi_execute_json_v3(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture(
        '3', 'testAllAtomicSingleV3', False)
    protocol = parse(protocol_data, None)
    ctx = ProtocolContext(loop=loop)
    ctx.home()
    # Check that we end up executing the protocol ok
    execute.run_protocol(protocol, ctx)
