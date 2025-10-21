"""Tests for robot_server.commands.get_default_orchestrator."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import MagDeck, TempDeck
from opentrons.protocol_runner import RunOrchestrator

from robot_server.errors.error_responses import ApiError
from robot_server.runs.run_orchestrator_store import (
    RunOrchestratorStore,
    RunConflictError,
)
from robot_server.modules.module_identifier import ModuleIdentifier, ModuleIdentity
from robot_server.commands.get_default_orchestrator import get_default_orchestrator


@pytest.fixture()
def run_orchestrator(decoy: Decoy) -> RunOrchestrator:
    """Get a mocked out ProtocolEngine."""
    return decoy.mock(cls=RunOrchestrator)


@pytest.fixture()
def run_orchestrator_store(decoy: Decoy) -> RunOrchestratorStore:
    """Get a mocked out EngineStore."""
    return decoy.mock(cls=RunOrchestratorStore)


@pytest.fixture()
def module_identifier(decoy: Decoy) -> ModuleIdentifier:
    """Get a mocked out ModuleIdentifier."""
    return decoy.mock(cls=ModuleIdentifier)


async def test_get_default_orchestrator(
    decoy: Decoy,
    run_orchestrator_store: RunOrchestratorStore,
    hardware_api: HardwareControlAPI,
    run_orchestrator: RunOrchestrator,
    module_identifier: ModuleIdentifier,
) -> None:
    """It should get a default engine with modules pre-loaded."""
    mod_1 = decoy.mock(cls=TempDeck)
    mod_2 = decoy.mock(cls=MagDeck)

    decoy.when(mod_1.device_info).then_return({"mod_1": "hello"})
    decoy.when(mod_2.device_info).then_return({"mod_2": "world"})

    decoy.when(module_identifier.identify({"mod_1": "hello"})).then_return(
        ModuleIdentity(
            module_id="mod-1",
            serial_number="serial-1",
            firmware_version="fw_1",
            hardware_revision="hw_1",
        )
    )
    decoy.when(module_identifier.identify({"mod_2": "world"})).then_return(
        ModuleIdentity(
            module_id="mod-2",
            serial_number="serial-2",
            firmware_version="fw_2",
            hardware_revision="hw_2",
        )
    )

    decoy.when(hardware_api.attached_modules).then_return([mod_1, mod_2])

    decoy.when(await run_orchestrator_store.get_default_orchestrator()).then_return(
        run_orchestrator
    )

    result = await get_default_orchestrator(
        run_orchestrator_store=run_orchestrator_store,
        hardware_api=hardware_api,
        module_identifier=module_identifier,
    )

    assert result is run_orchestrator

    decoy.verify(
        await run_orchestrator.use_attached_modules({"mod-1": mod_1, "mod-2": mod_2}),
        times=1,
    )


async def test_raises_conflict(
    decoy: Decoy,
    run_orchestrator_store: RunOrchestratorStore,
    hardware_api: HardwareControlAPI,
    module_identifier: ModuleIdentifier,
) -> None:
    """It should raise a 409 conflict if the default engine is not availble."""
    decoy.when(await run_orchestrator_store.get_default_orchestrator()).then_raise(
        RunConflictError("oh no")
    )

    with pytest.raises(ApiError) as exc_info:
        await get_default_orchestrator(
            run_orchestrator_store=run_orchestrator_store,
            hardware_api=hardware_api,
            module_identifier=module_identifier,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunActive"
