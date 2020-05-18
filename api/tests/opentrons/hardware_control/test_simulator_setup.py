from pathlib import Path

from opentrons.config import robot_configs
from opentrons.hardware_control.modules import MagDeck, Thermocycler, TempDeck
from opentrons.hardware_control import simulator_setup
from opentrons.types import Mount


async def test_with_magdeck(loop):
    setup = simulator_setup.SimulatorSetup(
        attached_modules={'magdeck': [
            simulator_setup.ModuleCall('engage', kwargs={'height': 3})]
        })
    simulator = await simulator_setup.create_simulator(setup)

    assert type(simulator.attached_modules[0]) == MagDeck
    assert simulator.attached_modules[0].live_data == {
        'data': {
            'engaged': True,
            'height': 3
        },
        'status': 'engaged'
    }


async def test_with_thermocycler(loop):
    setup = simulator_setup.SimulatorSetup(
        attached_modules={'thermocycler': [
            simulator_setup.ModuleCall('set_temperature',
                                       kwargs={
                                           'temperature': 3,
                                           'hold_time_seconds': 1,
                                           'hold_time_minutes': 2,
                                           'ramp_rate': 4,
                                           'volume': 5
                                       })
        ]})
    simulator = await simulator_setup.create_simulator(setup)

    assert type(simulator.attached_modules[0]) == Thermocycler
    assert simulator.attached_modules[0].live_data == {
        'data': {'currentCycleIndex': None,
                 'currentStepIndex': None,
                 'currentTemp': 3,
                 'holdTime': 0,
                 'lid': 'open',
                 'lidTarget': None,
                 'lidTemp': None,
                 'rampRate': 4,
                 'targetTemp': 3,
                 'totalCycleCount': None,
                 'totalStepCount': None},
        'status': 'holding at target'
        }


async def test_with_tempdeck(loop):
    setup = simulator_setup.SimulatorSetup(
        attached_modules={'tempdeck': [
            simulator_setup.ModuleCall('set_temperature',
                                       kwargs={'celsius': 23})]
        })
    simulator = await simulator_setup.create_simulator(setup)

    assert type(simulator.attached_modules[0]) == TempDeck
    assert simulator.attached_modules[0].live_data == {
        'data': {
            'currentTemp': 23,
            'targetTemp': 23
        },
        'status': 'holding at target'
    }


def test_persistance(tmpdir):
    sim = simulator_setup.SimulatorSetup(
        attached_instruments={
            Mount.LEFT: {'max_volume': 300},
            Mount.RIGHT: {'id': 'some id'},
        },
        attached_modules={
            'magdeck': [
                simulator_setup.ModuleCall('engage',
                                           kwargs={'height': 3})
            ],
            'tempdeck': [
                simulator_setup.ModuleCall('set_temperature',
                                           kwargs={'celsius': 23}),
                simulator_setup.ModuleCall('set_temperature',
                                           kwargs={'celsius': 24})
            ]
        },
        config=robot_configs.build_config([], {})
    )
    file = Path(tmpdir) / "sim_setup.json"
    simulator_setup.save_simulator_setup(sim, file)
    test_sim = simulator_setup.load_simulator_setup(file)

    assert test_sim == sim
