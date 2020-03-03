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


def test_dispatch_commands(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture('3', 'simple')
    mock_everything = mock.Mock()

    # nest calls under 'pipetteId' fake method of mock_everything
    mock_pipette = mock.create_autospec(InstrumentContext)
    mock_pipette.flow_rate.aspirate.setter = mock.Mock()
    mock_everything.pipetteId = mock_pipette
    insts = {"pipetteId": mock_pipette}

    mock_pipette.flow_rate.aspirate = 123
    # this should work, so that we can test the flow rates below
    assert mock_pipette.mock_calls == [mock.call(123)]

    # monkeypatch ProtocolContext methods we need to spy on using the mock
    ctx = ProtocolContext(loop=loop)
    monkeypatch.setattr(ctx, 'pause', mock_everything.pause)
    monkeypatch.setattr(ctx, 'delay', mock_everything.delay)

    mock_pipette.foo = 123  # TODO this should make the test fail
    # mock_pipette.no_such_method_woop(333)

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
        # ("set: flow_rate.aspirate", (3,)),
        # ("set: flow_rate.dispense", (3,)),
        # ("set: flow_rate.blow_out", (3,)),
        mock.call.pipetteId.aspirate(5, source_plate['A1'].bottom(2)),
        mock.call.delay(msg=None, seconds=42),
        # ("set: flow_rate.aspirate", (2.5,)),
        # ("set: flow_rate.dispense", (2.5,)),
        # ("set: flow_rate.blow_out", (2.5,)),
        mock.call.pipetteId.dispense(4.5, dest_plate['B1'].bottom(1)),
        mock.call.pipetteId.touch_tip(
            dest_plate['B1'], v_offset=0.33000000000000007),
        # ("set: flow_rate.aspirate", (2,)),
        # ("set: flow_rate.dispense", (2,)),
        # ("set: flow_rate.blow_out", (2,)),
        mock.call.pipetteId.blow_out(dest_plate['B1']),
        mock.call.pipetteId.move_to(ctx.deck.position_for('5').move(Point(x=1, y=2, z=3)),
                                    force_direct=None, minimum_z_height=None),
        mock.call.pipetteId.drop_tip(ctx.fixed_trash['A1'],)
    ]

    # mock_everything.assert_has_calls(calls)
    mock_everything.mock_calls == calls


def test_papi_execute_json_v3(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture(
        '3', 'testAllAtomicSingleV3', False)
    protocol = parse(protocol_data, None)
    ctx = ProtocolContext(loop=loop)
    ctx.home()
    # Check that we end up executing the protocol ok
    execute.run_protocol(protocol, ctx)
