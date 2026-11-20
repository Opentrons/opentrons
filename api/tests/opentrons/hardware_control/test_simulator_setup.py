from pathlib import Path
from typing import TYPE_CHECKING

from opentrons.config import robot_configs
from opentrons.hardware_control import simulator_setup
from opentrons.hardware_control.modules import MagDeck, TempDeck, Thermocycler
from opentrons.hardware_control.types import OT3Mount

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


async def assure_simulator_type() -> None:
    """It should create the appropriate kind of direct simulator."""
    simulator = await simulator_setup.create_simulator(
        simulator_setup.OT3SimulatorSetup()
    )
    assert isinstance(simulator, OT3API)


async def assure_thread_manager_type() -> None:
    """It should create the appropriate kind of thread manager simulator."""
    manager = await simulator_setup.create_simulator_thread_manager(
        simulator_setup.OT3SimulatorSetup()
    )
    assert isinstance(object.__getattribute__(manager, "managed_obj"), OT3API)


async def test_with_magdeck() -> None:
    """It should work to build a magdeck."""
    setup = simulator_setup.OT3SimulatorSetup(
        attached_modules={
            "magdeck": [
                simulator_setup.ModuleItem(
                    model="magneticModuleV1",
                    serial_number="123",
                    calls=[simulator_setup.ModuleCall("engage", kwargs={"height": 3})],
                ),
                simulator_setup.ModuleItem(
                    model="magneticModuleV2",
                    serial_number="1234",
                    calls=[simulator_setup.ModuleCall("engage", kwargs={"height": 5})],
                ),
            ]
        }
    )
    simulator = await simulator_setup.create_simulator(setup)

    assert isinstance(simulator.attached_modules[0], MagDeck)
    assert simulator.attached_modules[0].model() == "magneticModuleV1"
    assert simulator.attached_modules[0].live_data == {
        "data": {"engaged": True, "height": 3},
        "status": "engaged",
    }
    assert simulator.attached_modules[0].device_info["serial"] == "123"
    assert simulator.attached_modules[1].model() == "magneticModuleV2"
    assert simulator.attached_modules[1].live_data == {
        "data": {"engaged": True, "height": 5},
        "status": "engaged",
    }
    assert simulator.attached_modules[1].device_info["serial"] == "1234"


async def test_with_thermocycler() -> None:
    """It should work to build a thermocycler."""
    setup = simulator_setup.OT3SimulatorSetup(
        attached_modules={
            "thermocycler": [
                simulator_setup.ModuleItem(
                    model="thermocyclerModuleV2",
                    serial_number="123",
                    calls=[
                        simulator_setup.ModuleCall(
                            "set_temperature",
                            kwargs={
                                "temperature": 3,
                                "hold_time_seconds": 1,
                                "hold_time_minutes": 2,
                                "volume": 5,
                            },
                        )
                    ],
                )
            ]
        }
    )
    simulator = await simulator_setup.create_simulator(setup)

    assert isinstance(simulator.attached_modules[0], Thermocycler)
    assert simulator.attached_modules[0].model() == "thermocyclerModuleV2"
    assert simulator.attached_modules[0].live_data == {
        "data": {
            "currentCycleIndex": None,
            "currentStepIndex": None,
            "currentTemp": 3,
            "holdTime": 0,
            "lid": "open",
            "lidTarget": None,
            "lidTemp": 23,
            "lidTempStatus": "idle",
            "rampRate": None,
            "targetTemp": 3,
            "totalCycleCount": None,
            "totalStepCount": None,
        },
        "status": "holding at target",
    }
    assert simulator.attached_modules[0].device_info["serial"] == "123"


async def test_with_tempdeck() -> None:
    """It should work to build a tempdeck."""
    setup = simulator_setup.OT3SimulatorSetup(
        attached_modules={
            "tempdeck": [
                simulator_setup.ModuleItem(
                    model="temperatureModuleV2",
                    serial_number="123",
                    calls=[
                        simulator_setup.ModuleCall(
                            "start_set_temperature", kwargs={"celsius": 23}
                        ),
                        simulator_setup.ModuleCall(
                            "await_temperature", kwargs={"awaiting_temperature": None}
                        ),
                    ],
                )
            ]
        }
    )
    simulator = await simulator_setup.create_simulator(setup)

    assert isinstance(simulator.attached_modules[0], TempDeck)
    assert simulator.attached_modules[0].model() == "temperatureModuleV2"
    assert simulator.attached_modules[0].live_data == {
        "data": {"currentTemp": 23, "targetTemp": 23},
        "status": "holding at target",
    }
    assert simulator.attached_modules[0].device_info["serial"] == "123"


def test_persistence_ot3(tmpdir: str) -> None:
    sim = simulator_setup.OT3SimulatorSetup(
        attached_instruments={
            OT3Mount.LEFT: {"id": "an id"},
            OT3Mount.RIGHT: {"id": "some id"},
            OT3Mount.GRIPPER: {"id": "some-other-id"},
        },
        attached_modules={
            "magdeck": [
                simulator_setup.ModuleItem(
                    model="magneticModuleV2",
                    serial_number="mag-1",
                    calls=[
                        simulator_setup.ModuleCall(
                            function_name="engage",
                            kwargs={"height": 3},
                        )
                    ],
                )
            ],
            "tempdeck": [
                simulator_setup.ModuleItem(
                    model="temperatureModuleV2",
                    serial_number="temp-1",
                    calls=[
                        simulator_setup.ModuleCall(
                            function_name="set_temperature",
                            kwargs={"celsius": 23},
                        ),
                        simulator_setup.ModuleCall(
                            function_name="set_temperature",
                            kwargs={"celsius": 24},
                        ),
                    ],
                ),
                simulator_setup.ModuleItem(
                    model="temperatureModuleV1",
                    serial_number="temp-2",
                    calls=[
                        simulator_setup.ModuleCall(
                            function_name="set_temperature",
                            kwargs={"celsius": 23},
                        ),
                        simulator_setup.ModuleCall(
                            function_name="set_temperature",
                            kwargs={"celsius": 24},
                        ),
                    ],
                ),
            ],
        },
        config=robot_configs.build_config_ot3({}),
    )
    file = Path(tmpdir) / "sim_setup.json"
    simulator_setup.save_simulator_setup(sim, file)
    test_sim = simulator_setup.load_simulator_setup(file)

    assert test_sim == sim
