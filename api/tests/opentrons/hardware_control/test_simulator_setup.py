from opentrons.hardware_control.modules import MagDeck, Thermocycler
from opentrons.hardware_control import simulator_setup


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
