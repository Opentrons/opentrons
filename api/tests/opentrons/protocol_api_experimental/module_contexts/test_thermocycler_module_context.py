"""Tests for `thermocycler_module_context`."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.clients import SyncClient
from opentrons.protocol_api_experimental import ThermocyclerModuleContext


@pytest.fixture
def engine_client(decoy: Decoy) -> SyncClient:
    """Return a mock in the shape of a Protocol Engine client."""
    return decoy.mock(cls=SyncClient)


@pytest.fixture
def subject_module_id() -> str:
    """Return the ProtocolEngine module ID of the subject."""
    return "subject-module-id"


@pytest.fixture
def subject(
    engine_client: SyncClient, subject_module_id: str
) -> ThermocyclerModuleContext:
    """Return a ThermocyclerModuleContext with mocked dependencies."""
    return ThermocyclerModuleContext(
        engine_client=engine_client,
        module_id=subject_module_id,
    )


def test_deactivate_block(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: ThermocyclerModuleContext,
) -> None:
    """It should use the engine client to deactivate the block."""
    subject.deactivate_block()
    decoy.verify(
        engine_client.thermocycler_deactivate_block(subject_module_id),
        times=1,
    )


def test_deactivate_lid(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: ThermocyclerModuleContext,
) -> None:
    """It should use the engine client to deactivate the lid."""
    subject.deactivate_lid()
    decoy.verify(engine_client.thermocycler_deactivate_lid(subject_module_id), times=1)


def test_deactivate(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: ThermocyclerModuleContext,
) -> None:
    """It should use the engine client to deactivate both the lid and block."""
    subject.deactivate()
    decoy.verify(
        engine_client.thermocycler_deactivate_lid(subject_module_id),
        engine_client.thermocycler_deactivate_block(subject_module_id),
    )
