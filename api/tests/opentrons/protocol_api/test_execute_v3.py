from .test_accessor_fn import minimalLabwareDef2
from unittest import mock
from copy import deepcopy
import pytest
from opentrons.types import Location, Point
from opentrons.protocols.parse import parse
from opentrons.protocol_api import ProtocolContext, InstrumentContext, \
    execute, labware, MAX_SUPPORTED_VERSION
from opentrons.protocol_api.execute_v3 import _aspirate, _dispense, _delay, \
    _drop_tip, _blowout, dispatch_json, _pick_up_tip, _touch_tip, \
    _move_to_slot, load_labware_from_json_defs, _get_well, _set_flow_rate, \
    _get_location_with_offset, load_pipettes_from_json


def test_load_pipettes_from_json():
    def fake_pipette(name, mount):
        return (name, mount)
    ctx = mock.create_autospec(ProtocolContext)
    ctx.load_instrument = fake_pipette
    protocol = {'pipettes': {
        'aID': {'mount': 'left', 'name': 'a'},
        'bID': {'mount': 'right', 'name': 'b'}}}
    result = load_pipettes_from_json(ctx, protocol)
    assert result == {'aID': ('a', 'left'), 'bID': ('b', 'right')}


def test_get_well():
    deck = Location(Point(0, 0, 0), 'deck')
    well_name = 'A2'
    some_labware = labware.Labware(minimalLabwareDef2, deck)
    loaded_labware = {'someLabwareId': some_labware}
    params = {'labware': 'someLabwareId', 'well': well_name}
    result = _get_well(loaded_labware, params)
    assert result == some_labware[well_name]


def test_set_flow_rate():
    pipette = mock.create_autospec(InstrumentContext)
    pipette.flow_rate.aspirate = 1
    pipette.flow_rate.dispense = 2
    pipette.flow_rate.blow_out = 3
    params = {'flowRate': 42}

    _set_flow_rate(pipette, params)
    assert pipette.flow_rate.aspirate == 42
    assert pipette.flow_rate.dispense == 42
    assert pipette.flow_rate.blow_out == 42


def test_load_labware_from_json_defs(loop, get_labware_fixture):
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
    loaded_labware = load_labware_from_json_defs(ctx, data)

    # objects in loaded_labware should be same objs as labware objs in the deck
    assert loaded_labware['sourcePlateId'] == ctx.loaded_labwares[10]
    # use the displayName from protocol's labware.labwareId.displayName
    assert 'Source (Buffer)' in str(loaded_labware['sourcePlateId'])
    assert loaded_labware['destPlateId'] == ctx.loaded_labwares[11]
    # use the metadata.displayName from embedded def
    assert (custom_trough_def['metadata']['displayName'] in
            str(loaded_labware['destPlateId']))


def test_get_location_with_offset():
    deck = Location(Point(0, 0, 0), 'deck')
    some_labware = labware.Labware(minimalLabwareDef2, deck)
    loaded_labware = {'someLabwareId': some_labware}
    params = {'offsetFromBottomMm': 3,
              'labware': 'someLabwareId', 'well': 'A2'}
    result = _get_location_with_offset(loaded_labware, params)
    assert result == Location(Point(19, 28, 8), some_labware['A2'])


def test_get_location_with_offset_fixed_trash():
    deck = Location(Point(0, 0, 0), 'deck')
    trash_labware_def = deepcopy(minimalLabwareDef2)
    trash_labware_def['parameters']['quirks'] = ["fixedTrash"]
    trash_labware = labware.Labware(trash_labware_def, deck)

    loaded_labware = {'someLabwareId': trash_labware}
    params = {'offsetFromBottomMm': 3,
              'labware': 'someLabwareId', 'well': 'A1'}

    result = _get_location_with_offset(loaded_labware, params)

    assert result == Location(Point(10, 28, 45), trash_labware['A1'])


@pytest.mark.parametrize(
    'params, expected',
    [
        ({'wait': True, 'message': 'm'},
         [mock.call.pause(msg='m')]),
        ({'wait': 123, 'message': 'm'}, [
         mock.call.delay(seconds=123, msg='m')])
    ])
def test_delay(params, expected):
    mock_context = mock.MagicMock()
    _delay(mock_context, None, None, None, params)

    assert mock_context.mock_calls == expected


def test_blowout():
    m = mock.MagicMock()
    m.pipette_mock = mock.create_autospec(InstrumentContext)
    m.mock_set_flow_rate = mock.MagicMock()

    params = {'pipette': 'somePipetteId',
              'labware': 'someLabwareId', 'well': 'someWell'}
    instruments = {'somePipetteId': m.pipette_mock}
    well = 'theWell'
    loaded_labware = {'someLabwareId': {'someWell': well}}

    with mock.patch('opentrons.protocol_api.execute_v3._set_flow_rate',
                    new=m.mock_set_flow_rate):
        _blowout(None, None,
                 instruments, loaded_labware, params)

    assert m.mock_calls == [
        mock.call.mock_set_flow_rate(m.pipette_mock, params),
        mock.call.pipette_mock.blow_out(well)
    ]


def test_pick_up_tip():
    pipette_mock = mock.create_autospec(InstrumentContext)
    params = {'pipette': 'somePipetteId',
              'labware': 'someLabwareId', 'well': 'someWell'}
    instruments = {'somePipetteId': pipette_mock}
    well = 'theWell'
    loaded_labware = {'someLabwareId': {'someWell': well}}

    _pick_up_tip(None, None,
                 instruments, loaded_labware, params)

    assert pipette_mock.mock_calls == [
        mock.call.pick_up_tip(well)
    ]


def test_drop_tip():
    pipette_mock = mock.create_autospec(InstrumentContext)

    params = {'pipette': 'somePipetteId',
              'labware': 'someLabwareId', 'well': 'someWell'}
    instruments = {'somePipetteId': pipette_mock}
    well = 'theWell'
    loaded_labware = {'someLabwareId': {'someWell': well}}
    _drop_tip(None, None,
              instruments, loaded_labware, params)

    assert pipette_mock.mock_calls == [
        mock.call.drop_tip(well)
    ]


def test_aspirate():
    m = mock.MagicMock()
    m.pipette_mock = mock.create_autospec(InstrumentContext)
    m.mock_get_location_with_offset = mock.MagicMock(
        return_value=mock.sentinel.location)
    m.mock_set_flow_rate = mock.MagicMock()

    params = {'pipette': 'somePipetteId', 'volume': 42,
              'labware': 'someLabwareId', 'well': 'someWell'}
    instruments = {'somePipetteId': m.pipette_mock}

    with mock.patch(
            'opentrons.protocol_api.execute_v3._get_location_with_offset',
            new=m.mock_get_location_with_offset):
        with mock.patch(
                'opentrons.protocol_api.execute_v3._set_flow_rate',
                new=m.mock_set_flow_rate):
            _aspirate(None, None,
                      instruments, mock.sentinel.loaded_labware, params)

    assert m.mock_calls == [
        mock.call.mock_get_location_with_offset(
            mock.sentinel.loaded_labware, params),
        mock.call.mock_set_flow_rate(m.pipette_mock, params),
        mock.call.pipette_mock.aspirate(42, mock.sentinel.location)
    ]


def test_dispense():
    m = mock.MagicMock()
    m.pipette_mock = mock.create_autospec(InstrumentContext)
    m.mock_get_location_with_offset = mock.MagicMock(
        return_value=mock.sentinel.location)
    m.mock_set_flow_rate = mock.MagicMock()

    params = {'pipette': 'somePipetteId', 'volume': 42,
              'labware': 'someLabwareId', 'well': 'someWell'}
    instruments = {'somePipetteId': m.pipette_mock}

    with mock.patch(
        'opentrons.protocol_api.execute_v3._get_location_with_offset',
            new=m.mock_get_location_with_offset):
        with mock.patch(
            'opentrons.protocol_api.execute_v3._set_flow_rate',
                new=m.mock_set_flow_rate):
            _dispense(None, None,
                      instruments, mock.sentinel.loaded_labware, params)

    assert m.mock_calls == [
        mock.call.mock_get_location_with_offset(
            mock.sentinel.loaded_labware, params),
        mock.call.mock_set_flow_rate(m.pipette_mock, params),
        mock.call.pipette_mock.dispense(42, mock.sentinel.location)
    ]


def test_touch_tip():
    location = Location(Point(1, 2, 3), 'deck')
    well = labware.Well({
        'shape': 'circular',
        'depth': 40,
        'totalLiquidVolume': 100,
        'diameter': 30,
        'x': 40,
        'y': 50,
        'z': 3},
        parent=Location(Point(10, 20, 30), 1),
        has_tip=False,
        display_name='some well',
        api_level=MAX_SUPPORTED_VERSION)

    pipette_mock = mock.create_autospec(InstrumentContext, name='pipette_mock')
    mock_get_location_with_offset = mock.MagicMock(
        return_value=location, name='mock_get_location_with_offset')
    mock_get_well = mock.MagicMock(
        return_value=well, name='mock_get_well')
    mock_set_flow_rate = mock.MagicMock(name='mock_set_flow_rate')

    params = {'pipette': 'somePipetteId',
              'labware': 'someLabwareId', 'well': 'someWell'}
    instruments = {'somePipetteId': pipette_mock}

    with mock.patch(
        'opentrons.protocol_api.execute_v3._get_location_with_offset',
            new=mock_get_location_with_offset):
        with mock.patch(
            'opentrons.protocol_api.execute_v3._get_well',
                new=mock_get_well):
            with mock.patch(
                'opentrons.protocol_api.execute_v3._set_flow_rate',
                    new=mock_set_flow_rate):
                _touch_tip(None, None,
                           instruments, mock.sentinel.loaded_labware, params)

    # note: for this fn, order of calls doesn't matter b/c
    # we don't have stateful stuff like flow_rate
    mock_get_location_with_offset.assert_called_once_with(
        mock.sentinel.loaded_labware, params)
    mock_get_well.assert_called_once_with(mock.sentinel.loaded_labware, params)
    assert pipette_mock.mock_calls == [
        mock.call.touch_tip(well, v_offset=-70.0)]


def test_move_to_slot():
    slot_position = Location(Point(1, 2, 3), 'deck')
    mock_context = mock.create_autospec(ProtocolContext)
    mock_context.deck.position_for = mock.Mock(return_value=slot_position)
    pipette_mock = mock.create_autospec(InstrumentContext)

    instruments = {'somePipetteId': pipette_mock}

    params = {'pipette': 'somePipetteId', 'slot': '4',
              'offset': {'x': 10, 'y': 11, 'z': 12},
              'forceDirect': mock.sentinel.force_direct,
              'minimumZHeight': mock.sentinel.minimum_z_height}

    _move_to_slot(mock_context, None, instruments, None, params)

    assert pipette_mock.mock_calls == [
        mock.call.move_to(
            Location(Point(11, 13, 15), 'deck'),
            force_direct=mock.sentinel.force_direct,
            minimum_z_height=mock.sentinel.minimum_z_height)]


def test_dispatch_json():
    m = mock.MagicMock()
    with mock.patch(
        'opentrons.protocol_api.execute_v3.dispatcher_map',
            new={'a': m.a, 'b': m.b}):
        protocol_data = {'commands': [
            {'command': 'a', 'params': 'a_params'},
            {'command': 'b', 'params': 'b_params'}
        ]}
        instruments = mock.sentinel.instruments
        loaded_labware = mock.sentinel.loaded_labware
        dispatch_json(
            None, protocol_data, instruments, loaded_labware)

        assert m.mock_calls == [
            mock.call.a(None, protocol_data, instruments,
                        loaded_labware, 'a_params'),
            mock.call.b(None, protocol_data, instruments,
                        loaded_labware, 'b_params')
        ]


def test_dispatch_json_invalid_command():
    # no commands in mocked dispatcher map
    with mock.patch(
            'opentrons.protocol_api.execute_v3.dispatcher_map', new={}):
        protocol_data = {'commands': [
            {'command': 'no_such_command', 'params': 'foo'},
        ]}
        with pytest.raises(RuntimeError):
            dispatch_json(
                None, protocol_data, instruments=None, loaded_labware=None)


def test_papi_execute_json_v3(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture(
        '3', 'testAllAtomicSingleV3', False)
    protocol = parse(protocol_data, None)
    ctx = ProtocolContext(loop=loop)
    ctx.home()
    # Check that we end up executing the protocol ok
    execute.run_protocol(protocol, ctx)
