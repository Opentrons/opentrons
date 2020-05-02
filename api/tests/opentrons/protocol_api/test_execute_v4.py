from unittest import mock
import pytest
from opentrons.protocols.parse import parse
from opentrons.protocol_api.execute_v4 import dispatch_json, _engage_magnet, \
    _disengage_magnet, _temperature_module_set_temp, load_modules_from_json, \
    _temperature_module_deactivate, \
    _temperature_module_await_temp, \
    _thermocycler_close_lid, \
    _thermocycler_open_lid, \
    _thermocycler_deactivate_block, \
    _thermocycler_deactivate_lid, \
    _thermocycler_set_block_temperature, \
    _thermocycler_set_lid_temperature, \
    _thermocycler_run_profile, \
    TC_SPANNING_SLOT
import opentrons.protocol_api.execute_v4 as v4
from opentrons.protocol_api import MagneticModuleContext, \
    TemperatureModuleContext, ThermocyclerContext, \
    ProtocolContext, execute
from opentrons.protocol_api.constants import JsonCommand

# autouse set to True to setup/teardown mock after each run
@pytest.fixture(autouse=True)
def mockObj():
    m = mock.Mock()
    yield m
    m.reset()


@pytest.fixture
def pipette_command_map(mockObj):
    mock_pipette_command_map = {
        JsonCommand.blowout.value: mockObj._blowout,
        JsonCommand.pickUpTip.value: mockObj._pick_up_tip,
        JsonCommand.dropTip.value: mockObj._drop_tip,
        JsonCommand.aspirate.value: mockObj._aspirate,
        JsonCommand.dispense.value: mockObj._dispense,
        JsonCommand.touchTip.value: mockObj._touch_tip,
    }
    return mock_pipette_command_map


@pytest.fixture
def magnetic_module_command_map(mockObj):
    mock_magnetic_module_command_map = {
        JsonCommand.magneticModuleEngageMagnet.value:
        mockObj._engage_magnet,
        JsonCommand.magneticModuleDisengageMagnet.value:
        mockObj._disengage_magnet,
    }

    return mock_magnetic_module_command_map


@pytest.fixture
def temperature_module_command_map(mockObj):
    mock_temperature_module_command_map = {
        JsonCommand.temperatureModuleSetTargetTemperature.value:
        mockObj._temperature_module_set_temp,
        JsonCommand.temperatureModuleDeactivate.value:
        mockObj._temperature_module_deactivate,
        JsonCommand.temperatureModuleAwaitTemperature.value:
        mockObj._temperature_module_await_temp
    }
    return mock_temperature_module_command_map


@pytest.fixture
def thermocycler_module_command_map(mockObj):
    mock_thermocycler_module_command_map = {
        JsonCommand.thermocyclerCloseLid.value:
            mockObj._thermocycler_close_lid,
        JsonCommand.thermocyclerOpenLid.value:
            mockObj._thermocycler_open_lid,
        JsonCommand.thermocyclerDeactivateBlock.value:
            mockObj._thermocycler_deactivate_block,
        JsonCommand.thermocyclerDeactivateLid.value:
            mockObj._thermocycler_deactivate_lid,
        JsonCommand.thermocyclerSetTargetBlockTemperature.value:
            mockObj._thermocycler_set_block_temperature,
        JsonCommand.thermocyclerSetTargetLidTemperature.value:
            mockObj._thermocycler_set_lid_temperature,
        JsonCommand.thermocyclerRunProfile.value:
            mockObj._thermocycler_run_profile,
        # NOTE: the thermocyclerAwaitX commands are expected to always
        # follow a corresponding SetX command, which is implemented as
        # blocking. Then nothing needs to be done for awaitX commands.
        JsonCommand.thermocyclerAwaitBlockTemperature.value: \
            mockObj.tc_do_nothing,
        JsonCommand.thermocyclerAwaitLidTemperature.value: \
            mockObj.tc_do_nothing,
        JsonCommand.thermocyclerAwaitProfileComplete.value: \
            mockObj.tc_do_nothing
    }
    return mock_thermocycler_module_command_map


def test_load_modules_from_json():
    def fake_module(model, slot=None):
        return (model, slot)
    ctx = mock.create_autospec(ProtocolContext)
    ctx.load_module = fake_module
    protocol = {'modules': {
        'aID': {'slot': '1', 'model': 'magneticModuleV1'},
        'bID': {'slot': '4', 'model': 'temperatureModuleV2'},
        'cID': {
            'slot': TC_SPANNING_SLOT,
            'model': 'thermocyclerModuleV1'}
    }}
    result = load_modules_from_json(ctx, protocol)

    assert result == {'aID': ('magneticModuleV1', '1'),
                      'bID': ('temperatureModuleV2', '4'),
                      'cID': ('thermocyclerModuleV1', None)}


def test_engage_magnet():
    module_mock = mock.create_autospec(MagneticModuleContext)
    params = {'module': 'someModuleId', 'engageHeight': 4.2, }
    _engage_magnet(module_mock, params)

    assert module_mock.mock_calls == [
        mock.call.engage(height_from_base=4.2)
    ]


def test_disengage_magnet():
    module_mock = mock.create_autospec(MagneticModuleContext)
    params = {'module': 'someModuleId'}
    _disengage_magnet(module_mock, params)

    assert module_mock.mock_calls == [
        mock.call.disengage()
    ]


def test_temperature_module_set_temp():
    module_mock = mock.create_autospec(TemperatureModuleContext)
    params = {'module': 'someModuleId', 'temperature': 42.5}
    _temperature_module_set_temp(module_mock, params)

    assert module_mock.mock_calls == [
        mock.call.start_set_temperature(42.5)
    ]


def test_temperature_module_deactivate():
    module_mock = mock.create_autospec(TemperatureModuleContext)
    params = {'module': 'someModuleId'}
    _temperature_module_deactivate(module_mock, params)

    assert module_mock.mock_calls == [
        mock.call.deactivate()
    ]


def test_temperature_module_await_temp():
    module_mock = mock.create_autospec(TemperatureModuleContext)
    params = {'module': 'someModuleId', 'temperature': 12.3}
    _temperature_module_await_temp(module_mock, params)

    assert module_mock.mock_calls == [
        mock.call.await_temperature(12.3)
    ]


def test_thermocycler_close_lid():
    module_mock = mock.create_autospec(ThermocyclerContext)
    params = {"module": "someModuleId"}
    _thermocycler_close_lid(module_mock, params)
    assert module_mock.mock_calls == [
        mock.call.close_lid()
    ]


def test_thermocycler_open_lid():
    module_mock = mock.create_autospec(ThermocyclerContext)
    params = {"module": "someModuleId"}
    _thermocycler_open_lid(module_mock, params)
    assert module_mock.mock_calls == [
        mock.call.open_lid()
    ]


def test_thermocycler_deactivate_block():
    module_mock = mock.create_autospec(ThermocyclerContext)
    params = {"module": "someModuleId"}
    _thermocycler_deactivate_block(module_mock, params)
    assert module_mock.mock_calls == [
        mock.call.deactivate_block()
    ]


def test_thermocycler_deactivate_lid():
    module_mock = mock.create_autospec(ThermocyclerContext)
    params = {"module": "someModuleId"}
    _thermocycler_deactivate_lid(module_mock, params)
    assert module_mock.mock_calls == [
        mock.call.deactivate_lid()
    ]


def test_thermocycler_set_block_temperature():
    module_mock = mock.create_autospec(ThermocyclerContext)
    params = {"temperature": 42, "module": "someModuleId"}
    _thermocycler_set_block_temperature(module_mock, params)
    assert module_mock.mock_calls == [
        mock.call.set_block_temperature(42)
    ]


def test_thermocycler_set_lid_temperature():
    module_mock = mock.create_autospec(ThermocyclerContext)
    params = {"module": "someModuleId", "temperature": 42}
    _thermocycler_set_lid_temperature(module_mock, params)
    assert module_mock.mock_calls == [
        mock.call.set_lid_temperature(42)
    ]


def test_thermocycler_run_profile():
    module_mock = mock.create_autospec(ThermocyclerContext)
    params = {
        "profile": [
            {'temperature': 55, 'holdTime': 90},
            {'temperature': 65, 'holdTime': 30}
        ],
        "module": "someModuleId",
        "volume": 98
    }

    steps = [
        {'temperature': 55, 'hold_time_seconds': 90},
        {'temperature': 65, 'hold_time_seconds': 30}
    ]
    _thermocycler_run_profile(module_mock, params)
    assert module_mock.mock_calls == [
        mock.call.execute_profile(
            steps=steps, block_max_volume=98, repetitions=1)
    ]


def test_dispatch_json(
    monkeypatch,
    pipette_command_map,
    magnetic_module_command_map,
    temperature_module_command_map,
    thermocycler_module_command_map,
    mockObj
):

    monkeypatch.setattr(v4, '_delay', mockObj)
    monkeypatch.setattr(v4, '_move_to_slot', mockObj)

    magnetic_module_id = 'magnetic_module_id'
    temperature_module_id = 'temperature_module_id'
    thermocycler_module_id = 'thermocycler_module_id'

    mock_magnetic_module = mock.create_autospec(MagneticModuleContext)
    mock_temperature_module = mock.create_autospec(TemperatureModuleContext)
    mock_thermocycler_module = mock.create_autospec(ThermocyclerContext)

    protocol_data = {'commands': [
        # Pipette
        {'command': 'delay', 'params': 'delay_params'},
        {'command': 'blowout', 'params': 'blowout_params'},
        {'command': 'pickUpTip', 'params': 'pickUpTip_params'},
        {'command': 'dropTip', 'params': 'dropTip_params'},
        {'command': 'aspirate', 'params': 'aspirate_params'},
        {'command': 'dispense', 'params': 'dispense_params'},
        {'command': 'touchTip', 'params': 'touchTip_params'},
        {'command': 'moveToSlot', 'params': 'moveToSlot_params'},
        # Magnetic Module
        {'command': 'magneticModule/engageMagnet',
            'params': {'module': magnetic_module_id}},
        {'command': 'magneticModule/disengageMagnet',
            'params': {'module': magnetic_module_id}},
        # Temperature Module
        {'command': 'temperatureModule/setTargetTemperature',
            'params': {'module': temperature_module_id}},
        {'command': 'temperatureModule/deactivate',
            'params': {'module': temperature_module_id}},
        {'command': 'temperatureModule/awaitTemperature',
            'params': {'module': temperature_module_id}},
        # Thermocycler
        {
            "command": "thermocycler/setTargetBlockTemperature",
            "params": {
                "module": thermocycler_module_id,
                "temperature": 55
            }
        },
        {
            "command": "thermocycler/awaitBlockTemperature",
            "params": {
                "module": thermocycler_module_id,
                "temperature": 55
            }
        },
        {
            "command": "thermocycler/setTargetLidTemperature",
            "params": {
                "module": thermocycler_module_id,
                "temperature": 60
            }
        },
        {
            "command": "thermocycler/awaitLidTemperature",
            "params": {
                "module": thermocycler_module_id,
                "temperature": 60
            }
        },
        {
            "command": "thermocycler/closeLid",
            "params": {"module": thermocycler_module_id}
        },
        {
            "command": "thermocycler/openLid",
            "params": {"module": thermocycler_module_id}
        },
        {
            "command": "thermocycler/deactivateBlock",
            "params": {"module": thermocycler_module_id}
        },
        {
            "command": "thermocycler/deactivateLid",
            "params": {"module": thermocycler_module_id}
        },
        {
            "command": "thermocycler/closeLid",
            "params": {"module": thermocycler_module_id}
        },
        {
            "command": "thermocycler/runProfile",
            "params": {
                "module": thermocycler_module_id,
                "profile": [
                    {"temperature": 70, "holdTime": 60},
                    {"temperature": 40, "holdTime": 30},
                    {"temperature": 72, "holdTime": 60},
                    {"temperature": 38, "holdTime": 30}
                ],
                "volume": 123
            }
        },
        {
            "command": "thermocycler/awaitProfileComplete",
            "params": {"module": thermocycler_module_id}
        }
    ]}

    context = mock.sentinel.context
    instruments = mock.sentinel.instruments
    loaded_labware = mock.sentinel.loaded_labware

    modules = {
        magnetic_module_id: mock_magnetic_module,
        temperature_module_id: mock_temperature_module,
        thermocycler_module_id: mock_thermocycler_module
    }

    dispatch_json(
        context,
        protocol_data,
        instruments,
        loaded_labware,
        modules,
        pipette_command_map,
        magnetic_module_command_map,
        temperature_module_command_map,
        thermocycler_module_command_map
    )

    assert mockObj.mock_calls == [
        # Pipette
        mock.call._delay(context, 'delay_params'),
        mock.call._blowout(instruments, loaded_labware, 'blowout_params'),
        mock.call._pick_up_tip(
            instruments, loaded_labware, 'pickUpTip_params'),
        mock.call._drop_tip(instruments, loaded_labware, 'dropTip_params'),
        mock.call._aspirate(
            instruments, loaded_labware, 'aspirate_params'),
        mock.call._dispense(
            instruments, loaded_labware, 'dispense_params'),
        mock.call._touch_tip(
            instruments, loaded_labware, 'touchTip_params'),
        mock.call._move_to_slot(context, instruments, 'moveToSlot_params'),
        # Magnetic module
        mock.call._engage_magnet(
            mock_magnetic_module, {'module': magnetic_module_id}
        ),
        mock.call._disengage_magnet(
            mock_magnetic_module, {'module': magnetic_module_id}
        ),
        # Temperature module
        mock.call._temperature_module_set_temp(
            mock_temperature_module, {'module': temperature_module_id}
        ),
        mock.call._temperature_module_deactivate(
            mock_temperature_module, {'module': temperature_module_id}
        ),
        mock.call._temperature_module_await_temp(
            mock_temperature_module, {'module': temperature_module_id}
        ),
        # Thermocycler
        mock.call._thermocycler_set_block_temperature(
            mock_thermocycler_module,
            {'module': thermocycler_module_id, 'temperature': 55}
        ),
        # await block temp = do nothing (corresponding set is blocking)
        mock.call.tc_do_nothing(
            mock_thermocycler_module,
            {'module': thermocycler_module_id, 'temperature': 55}
        ),
        mock.call._thermocycler_set_lid_temperature(
            mock_thermocycler_module,
            {'module': thermocycler_module_id, 'temperature': 60}
        ),
        # await lid temp = do nothing (corresponding set is blocking)
        mock.call.tc_do_nothing(
            mock_thermocycler_module,
            {'module': thermocycler_module_id, 'temperature': 60}
        ),
        mock.call._thermocycler_close_lid(
            mock_thermocycler_module, {'module': thermocycler_module_id}
        ),
        mock.call._thermocycler_open_lid(
            mock_thermocycler_module, {'module': thermocycler_module_id}
        ),
        mock.call._thermocycler_deactivate_block(
            mock_thermocycler_module, {'module': thermocycler_module_id}
        ),
        mock.call._thermocycler_deactivate_lid(
            mock_thermocycler_module, {'module': thermocycler_module_id}
        ),
        mock.call._thermocycler_close_lid(
            mock_thermocycler_module, {'module': thermocycler_module_id}
        ),
        mock.call._thermocycler_run_profile(
            mock_thermocycler_module, {
                "module": thermocycler_module_id,
                "profile": [
                    {"temperature": 70, "holdTime": 60},
                    {"temperature": 40, "holdTime": 30},
                    {"temperature": 72, "holdTime": 60},
                    {"temperature": 38, "holdTime": 30}
                ],
                "volume": 123
            }
        ),
        # await profile complete = do nothing
        # (corresponding set is blocking)
        mock.call.tc_do_nothing(
            mock_thermocycler_module,
            {'module': thermocycler_module_id}
        )
    ]


def test_dispatch_json_invalid_command(
    pipette_command_map,
    magnetic_module_command_map,
    temperature_module_command_map,
    thermocycler_module_command_map
):
    protocol_data = {'commands': [
        {'command': 'no_such_command', 'params': 'foo'},
    ]}
    with pytest.raises(RuntimeError):
        dispatch_json(
            context=None,
            protocol_data=protocol_data,
            instruments=None,
            loaded_labware=None,
            modules=None,
            pipette_command_map=pipette_command_map,
            magnetic_module_command_map=magnetic_module_command_map,
            temperature_module_command_map=temperature_module_command_map,
            thermocycler_module_command_map=thermocycler_module_command_map
        )


def test_papi_execute_json_v4(monkeypatch, loop, get_json_protocol_fixture):
    protocol_data = get_json_protocol_fixture(
        '4', 'testModulesProtocol', False)
    protocol = parse(protocol_data, None)
    ctx = ProtocolContext(loop=loop)
    ctx.home()
    # Check that we end up executing the protocol ok
    execute.run_protocol(protocol, ctx)
