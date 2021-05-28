import pytest
from mock import MagicMock
from opentrons.drivers.types import MoveSplit
from opentrons.hardware_control.emulation.app import SMOOTHIE_PORT

from tests.opentrons.conftest import fuzzy_assert
from opentrons.config.robot_configs import (
    DEFAULT_GANTRY_STEPS_PER_MM, DEFAULT_PIPETTE_CONFIGS, build_config)
from opentrons.drivers.asyncio.smoothie import SmoothieDriver


@pytest.fixture
async def subject(emulation_app) -> SmoothieDriver:
    """Smoothie driver connected to emulator."""
    d = await SmoothieDriver.build(
        port=f"socket://127.0.0.1:{SMOOTHIE_PORT}",
        config=build_config({})
    )
    yield d
    await d.disconnect()


@pytest.fixture
def spy(subject: SmoothieDriver) -> MagicMock:
    """Attach a spy to gcode sender."""
    spy = MagicMock(wraps=subject._connection.send_data)
    subject._connection.send_data = spy
    return spy


async def test_dwell_and_activate_axes(
        subject: SmoothieDriver, spy: MagicMock
):
    subject.activate_axes('X')
    await subject._set_saved_current()
    subject.dwell_axes('X')
    await subject._set_saved_current()
    subject.activate_axes('XYBC')
    await subject._set_saved_current()
    subject.dwell_axes('XC')
    await subject._set_saved_current()
    subject.dwell_axes('BCY')
    await subject._set_saved_current()
    expected = [
        ['M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y1.25 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y1.25 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]

    fuzzy_assert(result=command_log, expected=expected)


async def test_disable_motor(
        subject: SmoothieDriver, spy: MagicMock
):
    await subject.disengage_axis('X')
    await subject.disengage_axis('XYZ')
    await subject.disengage_axis('ABCD')
    expected = [
        ['M18 X'],
        ['M400'],
        ['M18 [XYZ]+'],
        ['M400'],
        ['M18 [ABC]+'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)


async def test_plunger_commands(subject: SmoothieDriver, spy: MagicMock):
    await subject.home()
    expected = [
        ['M907 A0.8 B0.05 C0.05 X0.3 Y0.3 Z0.8 G4 P0.005 G28.2.+[ABCZ].+'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M203.1 Y50'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.8 Z0.1 G4 P0.005 G91 G0 Y-28 G0 Y10 G90'],
        ['M400'],
        ['M203.1 X80'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4 P0.005 G28.2 X'],
        ['M400'],
        ['M203.1 A125 B40 C40 X600 Y400 Z125'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M203.1 Y80'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y1.25 Z0.1 G4 P0.005 G28.2 Y'],
        ['M400'],
        ['M203.1 Y8'],
        ['M400'],
        ['G91 G0 Y-3 G90'],
        ['M400'],
        ['G28.2 Y'],
        ['M400'],
        ['G91 G0 Y-3 G90'],
        ['M400'],
        ['M203.1 A125 B40 C40 X600 Y400 Z125'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M114.2'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)

    spy.reset_mock()

    await subject.move({'X': 0, 'Y': 1.123456, 'Z': 2, 'A': 3})
    expected = [
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005 G0.+'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)

    spy.reset_mock()

    await subject.move({'B': 2})
    expected = [
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005 G0 B2'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)

    spy.reset_mock()

    await subject.move({
        'X': 10.987654321,
        'Y': 2.12345678,
        'Z': 2.5,
        'A': 3.5,
        'B': 4.25,
        'C': 5.55})
    expected = [
        # Set active axes high
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005 G0.+[BC].+'],
        ['M400'],
        # Set plunger current low
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)


async def test_move_with_split(subject: SmoothieDriver, spy: MagicMock):
    await subject.home()
    spy.reset_mock()

    subject.configure_splits_for(
        {
            "B": MoveSplit(
                split_distance=1,
                split_current=1.75,
                split_speed=1,
                after_time=1800,
                fullstep=True),
            "C": MoveSplit(
                split_distance=1,
                split_current=1.75,
                split_speed=1,
                after_time=1800,
                fullstep=True)
        }
    )
    subject._steps_per_mm = {"B": 1.0, "C": 1.0}

    await subject.move({'X': 0, 'Y': 1.123456, 'Z': 2, 'C': 3})
    expected = [
        ['M55 M92 C0.03125 G4 P0.01 G0 F60 M907 A0.1 B0.05 C1.75 X1.25 Y1.25 '
         'Z0.8 G4 P0.005'],
        ['M400'],
        ['G0 C18.0'],
        ['M400'],
        ['M54 M92 C1.0 G4 P0.01'],
        ['M400'],
        ['G0 F24000 M907 A0.1 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005 G0.+'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)

    spy.reset_mock()

    await subject.move({'B': 2})
    expected = [
        ['M53 M92 B0.03125 G4 P0.01 G0 F60 M907 A0.1 B1.75 C0.05 '
         'X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['G0 B18.0'],
        ['M400'],
        ['M52 M92 B1.0 G4 P0.01'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005 G0 B2'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)


async def test_set_active_current(subject: SmoothieDriver, spy: MagicMock):
    await subject.home()
    spy.reset_mock()

    subject.set_active_current(
        {'X': 2, 'Y': 2, 'Z': 2, 'A': 2, 'B': 2, 'C': 2})
    subject.set_dwelling_current(
        {'X': 0, 'Y': 0, 'Z': 0, 'A': 0, 'B': 0, 'C': 0})

    await subject.move({'X': 0, 'Y': 0, 'Z': 0, 'A': 0, 'B': 0, 'C': 0})
    await subject.move({'B': 1, 'C': 1})
    subject.set_active_current({'B': 0.42, 'C': 0.42})
    await subject.home('BC')
    expected = [
        # move all
        ['M907 A2 B2 C2 X2 Y2 Z2 G4 P0.005 G0 A0 B0 C0 X0 Y0 Z0'],
        ['M400'],
        ['M907 A2 B0 C0 X2 Y2 Z2 G4 P0.005'],  # disable BC axes
        ['M400'],
        # move BC
        ['M907 A0 B2 C2 X0 Y0 Z0 G4 P0.005 G0 B1.3 C1.3 G0 B1 C1'],
        ['M400'],
        ['M907 A0 B0 C0 X0 Y0 Z0 G4 P0.005'],  # disable BC axes
        ['M400'],
        ['M907 A0 B0.42 C0.42 X0 Y0 Z0 G4 P0.005 G28.2 BC'],  # home BC
        ['M400'],
        ['M907 A0 B0 C0 X0 Y0 Z0 G4 P0.005'],  # dwell all axes after home
        ['M400'],
        ['M114.2'],  # update the position
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)


async def test_steps_per_mm(subject: SmoothieDriver, spy: MagicMock):
    expected = {
        **DEFAULT_GANTRY_STEPS_PER_MM,
        'B': DEFAULT_PIPETTE_CONFIGS['stepsPerMM'],
        'C': DEFAULT_PIPETTE_CONFIGS['stepsPerMM'],
    }
    assert subject.steps_per_mm == expected
    await subject.update_steps_per_mm({'Z': 450})
    expected['Z'] = 450
    assert subject.steps_per_mm == expected

    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    assert command_log == ['M92 Z450', 'M400']


async def test_pipette_configs(subject: SmoothieDriver, spy: MagicMock):
    res = await subject.update_pipette_config(
        'Z',
        {'home': 175, 'debounce': 12, 'max_travel': 13, 'retract': 14}
    )
    expected_return = {'Z': {'home': 175, 'debounce': 12, 'max_travel': 13, 'retract': 14}}
    assert res == expected_return

    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    assert command_log == [
        'M365.0 Z175',
        'M400',
        'M365.2 O12',
        'M400',
        'M365.1 Z13',
        'M400',
        'M365.3 Z14',
        'M400'
    ]


async def test_set_acceleration(subject: SmoothieDriver, spy: MagicMock):
    await subject.set_acceleration(
        {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6})
    subject.push_acceleration()
    await subject.pop_acceleration()
    await subject.set_acceleration(
        {'X': 10, 'Y': 20, 'Z': 30, 'A': 40, 'B': 50, 'C': 60})
    await subject.pop_acceleration()

    expected = [
        ['M204 S10000 A4 B5 C6 X1 Y2 Z3'],
        ['M400'],
        ['M204 S10000 A4 B5 C6 X1 Y2 Z3'],
        ['M400'],
        ['M204 S10000 A40 B50 C60 X10 Y20 Z30'],
        ['M400'],
        ['M204 S10000 A4 B5 C6 X1 Y2 Z3'],
        ['M400'],
    ]
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    fuzzy_assert(result=command_log, expected=expected)


async def test_read_and_write_pipettes(subject: SmoothieDriver, spy: MagicMock):
    test_id = 'TestsRock!!'
    test_model = 'TestPipette'
    await subject.write_pipette_id('left', test_id)
    read_id = await subject.read_pipette_id('left')
    assert read_id == test_id

    await subject.write_pipette_model('left', test_model)
    read_model = await subject.read_pipette_model('left')
    assert read_model == test_model + '_v1'


async def test_fast_home(subject: SmoothieDriver, spy: MagicMock):
    await subject.fast_home(axis='X', safety_margin=12)

    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    assert command_log == [
        'M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4 P0.005 G0 X406.0',
        'M400',
        'M203.1 Y50',
        'M400',
        'M907 A0.1 B0.05 C0.05 X1.25 Y0.8 Z0.1 G4 P0.005 G91 G0 Y-28 G0 Y10 G90',
        'M400',
        'M203.1 X80',
        'M400',
        'M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4 P0.005 G28.2 X',
        'M400',
        'M203.1 A125 B40 C40 X600 Y400 Z125',
        'M400',
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005',
        'M400',
        'M114.2',
        'M400'
    ]


async def test_update_homing_flags(subject: SmoothieDriver, spy: MagicMock):
    await subject.update_homed_flags()
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    assert command_log == [
        'G28.6',
        'M400'
    ]


async def test_update_pipette_config(subject: SmoothieDriver, spy: MagicMock):
    await subject.update_pipette_config("X", {
        'retract': 2,
        'debounce': 3,
        'max_travel': 4,
        'home': 5
    })
    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    assert command_log == [
        "M365.3 X2",
        "M400",
        "M365.2 O3",
        "M400",
        "M365.1 X4",
        "M400",
        "M365.0 X5",
        "M400",
    ]


async def test_do_relative_splits_during_home_for(subject: SmoothieDriver, spy: MagicMock):
    """Test command structure when a split configuration is present."""
    subject.configure_splits_for(
        {
            "B": MoveSplit(
                split_distance=1,
                split_current=1.75,
                split_speed=1,
                after_time=1800,
                fullstep=True)
        }
    )
    subject._steps_per_mm = {"B": 1.0, "C": 1.0}

    await subject._do_relative_splits_during_home_for("BC")

    command_log = [x.kwargs['data'].strip() for x in spy.call_args_list]
    assert command_log == [
        'M53 M55 M92 B0.03125 C0.03125 G4 P0.01 M907 B1.75 G4 P0.005 G0 F60 G91',
        'M400',
        'G0 B-1',
        'M400',
        'G90 M52 M54 M92 B1.0 C1.0 G4 P0.01 G0 F24000',
        'M400',
    ]
