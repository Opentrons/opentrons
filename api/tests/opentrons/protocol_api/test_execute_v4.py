from unittest import mock
import pytest
from opentrons.protocol_api.execute_v4 import dispatch_json, _engage_magnet, \
    _disengage_magnet, _temperature_module_set_temp, \
    _temperature_module_deactivate, \
    _temperature_module_await_temp
from opentrons.protocol_api import MagneticModuleContext, \
    TemperatureModuleContext


def test_engage_magnet():
    module_mock = mock.create_autospec(MagneticModuleContext)
    modules = {'someModuleId': module_mock}

    params = {'module': 'someModuleId', 'engageHeight': 4.2, }
    _engage_magnet(modules, params)

    assert module_mock.mock_calls == [
        mock.call.engage(height_from_base=4.2)
    ]


def test_disengage_magnet():
    module_mock = mock.create_autospec(MagneticModuleContext)
    modules = {'someModuleId': module_mock}

    params = {'module': 'someModuleId'}
    _disengage_magnet(modules, params)

    assert module_mock.mock_calls == [
        mock.call.disengage()
    ]


def test_temperature_module_set_temp():
    module_mock = mock.create_autospec(TemperatureModuleContext)
    modules = {'someModuleId': module_mock}

    params = {'module': 'someModuleId', 'temperature': 42.5}
    _temperature_module_set_temp(modules, params)

    assert module_mock.mock_calls == [
        mock.call.start_set_temperature(42.5)
    ]


def test_temperature_module_deactivate():
    module_mock = mock.create_autospec(TemperatureModuleContext)
    modules = {'someModuleId': module_mock}

    params = {'module': 'someModuleId'}
    _temperature_module_deactivate(modules, params)

    assert module_mock.mock_calls == [
        mock.call.deactivate()
    ]


def test_temperature_module_await_temp():
    module_mock = mock.create_autospec(TemperatureModuleContext)
    modules = {'someModuleId': module_mock}

    params = {'module': 'someModuleId', 'temperature': 12.3}
    _temperature_module_await_temp(modules, params)

    # TODO IMMEDIATELY must be implemented in executor
    assert False


def test_dispatch_json():
    m = mock.MagicMock()
    mock_dispatcher_map = {
        "delay": m._delay,
        "blowout": m._blowout,
        "pickUpTip": m._pick_up_tip,
        "dropTip": m._drop_tip,
        "aspirate": m._aspirate,
        "dispense": m._dispense,
        "touchTip": m._touch_tip,
        "moveToSlot": m._move_to_slot,
        "magneticModule/engageMagnet": m._engage_magnet,
        "magneticModule/disengageMagnet": m._disengage_magnet,
        "temperatureModule/setTargetTemperature":
            m._temperature_module_set_temp,
        "temperatureModule/deactivate": m._temperature_module_deactivate,
        "temperatureModule/awaitTemperature": m._temperature_module_await_temp
    }

    with mock.patch(
        'opentrons.protocol_api.execute_v4.dispatcher_map',
            new=mock_dispatcher_map):
        protocol_data = {'commands': [
            {'command': 'delay', 'params': 'delay_params'},
            {'command': 'blowout', 'params': 'blowout_params'},
            {'command': 'pickUpTip', 'params': 'pickUpTip_params'},
            {'command': 'dropTip', 'params': 'dropTip_params'},
            {'command': 'aspirate', 'params': 'aspirate_params'},
            {'command': 'dispense', 'params': 'dispense_params'},
            {'command': 'touchTip', 'params': 'touchTip_params'},
            {'command': 'moveToSlot', 'params': 'moveToSlot_params'},
            {'command': 'magneticModule/engageMagnet',
                'params': 'engageMagnet_params'},
            {'command': 'magneticModule/disengageMagnet',
                'params': 'disengageMagnet_params'},
            {'command': 'temperatureModule/setTargetTemperature',
                'params': 'temperature_module_set_temp_params'},
            {'command': 'temperatureModule/deactivate',
                'params': 'temperature_module_deactivate_params'},
            {'command': 'temperatureModule/awaitTemperature',
                'params': 'temperature_module_await_temp_params'},
        ]}
        context = mock.sentinel.context
        instruments = mock.sentinel.instruments
        loaded_labware = mock.sentinel.loaded_labware
        modules = mock.sentinel.modules
        dispatch_json(
            context, protocol_data, instruments, loaded_labware, modules)

        assert m.mock_calls == [
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
            mock.call._engage_magnet(modules, 'engageMagnet_params'),
            mock.call._disengage_magnet(modules, 'disengageMagnet_params'),
            mock.call._temperature_module_set_temp(
                modules, 'temperature_module_set_temp_params'),
            mock.call._temperature_module_deactivate(
                modules, 'temperature_module_deactivate_params'),
            mock.call._temperature_module_await_temp(
                modules, 'temperature_module_await_temp_params')
        ]


def test_dispatch_json_invalid_command():
    protocol_data = {'commands': [
        {'command': 'no_such_command', 'params': 'foo'},
    ]}
    with pytest.raises(RuntimeError):
        dispatch_json(
            context=None, protocol_data=protocol_data, instruments=None,
            loaded_labware=None, modules=None)


# TODO IMMEDIATELY
#
# def test_papi_execute_json_v4(monkeypatch, loop, get_json_protocol_fixture):
#     protocol_data = get_json_protocol_fixture(
#         '4', 'someV4Protocol', False)
#     protocol = parse(protocol_data, None)
#     ctx = ProtocolContext(loop=loop)
#     ctx.home()
#     # Check that we end up executing the protocol ok
#     execute.run_protocol(protocol, ctx)
