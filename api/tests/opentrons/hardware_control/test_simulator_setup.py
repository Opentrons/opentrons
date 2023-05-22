from pathlib import Path
from typing import Type, Union, TYPE_CHECKING

import pytest

from opentrons.config import robot_configs
from opentrons.hardware_control.modules import MagDeck, Thermocycler, TempDeck
from opentrons.hardware_control import simulator_setup, API
from opentrons.types import Mount
from opentrons_shared_data.robot.dev_types import RobotType
from opentrons.hardware_control.types import OT3Mount

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def setup_klass(robot_model: RobotType) -> Type[simulator_setup.SimulatorSetup]:
    """Get the appropriate setup class for the machine type."""
    if robot_model == "OT-2 Standard":
        return simulator_setup.OT2SimulatorSetup
    else:
        return simulator_setup.OT3SimulatorSetup


@pytest.fixture
def simulator_type(robot_model: RobotType) -> Union[Type[API], Type["OT3API"]]:
    """Get the appropriate simulated hardware controller instance type."""
    if robot_model == "OT-2 Standard":
        return API
    else:
        from opentrons.hardware_control.ot3api import OT3API

        return OT3API


async def assure_simulator_type(
    setup_klass: Type[simulator_setup.SimulatorSetup],
    simulator_type: Union[Type[API], Type["OT3API"]],
) -> None:
    """It should create the appropriate kind of direct simulator."""
    simulator = await simulator_setup.create_simulator(setup_klass())
    assert isinstance(simulator, simulator_type)


async def assure_thread_manager_type(
    setup_klass: Type[simulator_setup.SimulatorSetup],
    simulator_type: Union[Type[API], Type["OT3API"]],
) -> None:
    """It should create the appropriate kind of thread manager simulator."""
    manager = await simulator_setup.create_simulator_thread_manager(setup_klass())
    assert isinstance(object.__getattribute__(manager, "managed_obj"), simulator_type)


async def test_with_magdeck(setup_klass: Type[simulator_setup.SimulatorSetup]) -> None:
    """It should work to build a magdeck."""
    setup = setup_klass(
        attached_modules={
            "magdeck": [simulator_setup.ModuleCall("engage", kwargs={"height": 3})]
        }
    )
    simulator = await simulator_setup.create_simulator(setup)

    assert type(simulator.attached_modules[0]) == MagDeck
    assert simulator.attached_modules[0].live_data == {
        "data": {"engaged": True, "height": 3},
        "status": "engaged",
    }


async def test_with_thermocycler(
    setup_klass: Type[simulator_setup.SimulatorSetup],
) -> None:
    """It should work to build a thermocycler."""
    setup = setup_klass(
        attached_modules={
            "thermocycler": [
                simulator_setup.ModuleCall(
                    "set_temperature",
                    kwargs={
                        "temperature": 3,
                        "hold_time_seconds": 1,
                        "hold_time_minutes": 2,
                        "volume": 5,
                    },
                )
            ]
        }
    )
    simulator = await simulator_setup.create_simulator(setup)

    assert type(simulator.attached_modules[0]) == Thermocycler
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


async def test_with_tempdeck(setup_klass: Type[simulator_setup.SimulatorSetup]) -> None:
    """It should work to build a tempdeck."""
    setup = setup_klass(
        attached_modules={
            "tempdeck": [
                simulator_setup.ModuleCall(
                    "start_set_temperature", kwargs={"celsius": 23}
                ),
                simulator_setup.ModuleCall(
                    "await_temperature", kwargs={"awaiting_temperature": None}
                ),
            ]
        }
    )
    simulator = await simulator_setup.create_simulator(setup)

    assert type(simulator.attached_modules[0]) == TempDeck
    assert simulator.attached_modules[0].live_data == {
        "data": {"currentTemp": 23, "targetTemp": 23},
        "status": "holding at target",
    }


def test_persistence_ot2(tmpdir: str) -> None:
    sim = simulator_setup.OT2SimulatorSetup(
        attached_instruments={
            Mount.LEFT: {"id": "an id"},
            Mount.RIGHT: {"id": "some id"},
        },
        attached_modules={
            "magdeck": [simulator_setup.ModuleCall("engage", kwargs={"height": 3})],
            "tempdeck": [
                simulator_setup.ModuleCall("set_temperature", kwargs={"celsius": 23}),
                simulator_setup.ModuleCall("set_temperature", kwargs={"celsius": 24}),
            ],
        },
        config=robot_configs.build_config_ot2({}),
    )
    file = Path(tmpdir) / "sim_setup.json"
    simulator_setup.save_simulator_setup(sim, file)
    test_sim = simulator_setup.load_simulator_setup(file)

    assert test_sim == sim


def test_persistence_ot3(tmpdir: str) -> None:
    sim = simulator_setup.OT3SimulatorSetup(
        attached_instruments={
            OT3Mount.LEFT: {"id": "an id"},
            OT3Mount.RIGHT: {"id": "some id"},
            OT3Mount.GRIPPER: {"id": "some-other-id"},
        },
        attached_modules={
            "magdeck": [simulator_setup.ModuleCall("engage", kwargs={"height": 3})],
            "tempdeck": [
                simulator_setup.ModuleCall("set_temperature", kwargs={"celsius": 23}),
                simulator_setup.ModuleCall("set_temperature", kwargs={"celsius": 24}),
            ],
        },
        config=robot_configs.build_config_ot3({}),
    )
    file = Path(tmpdir) / "sim_setup.json"
    simulator_setup.save_simulator_setup(sim, file)
    test_sim = simulator_setup.load_simulator_setup(file)

    assert test_sim == sim
