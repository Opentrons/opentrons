"""Tests for `magnetic_module_context`."""


from typing import cast

from decoy import Decoy
import pytest

from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine import ModuleLocation, commands as pe_commands
from opentrons.protocol_engine.clients import SyncClient

from opentrons.protocol_api_experimental import (
    Labware,
    MagneticModuleContext,
    InvalidMagnetEngageHeightError,
)


@pytest.fixture
def engine_client(decoy: Decoy) -> SyncClient:
    """Return a mock in the shape of a Protocol Engine client."""
    return decoy.mock(cls=SyncClient)


@pytest.fixture
def subject_module_id() -> str:
    """Return the Protocol Engine module ID of the subject."""
    return "subject-module-id"


@pytest.fixture
def subject(engine_client: SyncClient, subject_module_id: str) -> MagneticModuleContext:
    """Return a MagneticModuleContext with mocked dependencies."""
    return MagneticModuleContext(
        engine_client=engine_client, module_id=subject_module_id
    )


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_api_version(subject: MagneticModuleContext) -> None:  # noqa: D103
    _ = subject.api_version


def test_load_labware_default_namespace_and_version(
    decoy: Decoy,
    minimal_labware_def: LabwareDefinition,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should default namespace to "opentrons" and version to 1."""
    decoy.when(
        engine_client.load_labware(
            location=ModuleLocation(moduleId=subject_module_id),
            load_name="some_labware",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        pe_commands.LoadLabwareResult(
            labwareId="abc123",
            definition=minimal_labware_def,
            offsetId=None,
        )
    )

    result = subject.load_labware(name="some_labware")
    assert result == Labware(labware_id="abc123", engine_client=engine_client)


def test_load_labware_explicit_namespace_and_version(
    decoy: Decoy,
    minimal_labware_def: LabwareDefinition,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should pass along the namespace, version, and load name."""
    decoy.when(
        engine_client.load_labware(
            location=ModuleLocation(moduleId=subject_module_id),
            load_name="some_labware",
            namespace="some_explicit_namespace",
            version=9001,
        )
    ).then_return(
        pe_commands.LoadLabwareResult(
            labwareId="abc123",
            definition=minimal_labware_def,
            offsetId=None,
        )
    )
    result = subject.load_labware(
        name="some_labware",
        namespace="some_explicit_namespace",
        version=9001,
    )
    assert result == Labware(labware_id="abc123", engine_client=engine_client)


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_load_labware_with_label(  # noqa: D103
    subject: MagneticModuleContext,
) -> None:
    subject.load_labware(name="some_load_name", label="some_label")


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_load_labware_from_definition(  # noqa: D103
    subject: MagneticModuleContext,
) -> None:
    subject.load_labware_from_definition(definition={})  # type: ignore[typeddict-item]


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_labware_property(subject: MagneticModuleContext) -> None:  # noqa: D103
    _ = subject.labware


def test_engage_only_one_height_allowed(subject: MagneticModuleContext) -> None:
    """It should raise if you provide conflicting height arguments."""
    # The type-checker wants to stop us from miscalling this function, but
    # we need to test that the function protects itself when there is no type-checker.
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, height_from_base=2, offset=3)  # type: ignore[call-overload]  # noqa: E501
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, height_from_base=2)  # type: ignore[call-overload]
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, offset=3)  # type: ignore[call-overload]
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height_from_base=2, offset=3)  # type: ignore[call-overload]


def test_engage_height_from_home(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should pass the correct height to the Protocol Engine command."""
    decoy.when(
        engine_client.state.modules.get_magnet_offset_to_labware_bottom(
            module_id=subject_module_id
        )
    ).then_return(1.1)
    subject.engage(height=3.3)
    decoy.verify(
        engine_client.magnetic_module_engage(
            module_id=subject_module_id, engage_height=cast(float, pytest.approx(2.2))
        ),
    )


def test_engage_height_from_base(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should pass the correct height to the Protocol Engine command."""
    subject.engage(height_from_base=12.34)
    decoy.verify(
        engine_client.magnetic_module_engage(
            module_id=subject_module_id, engage_height=12.34
        )
    )

# To do before merge: Test error if no labware loaded and use offset or none
# To do before merge: Test error if labware loaded does not have intrinsic heigh
# Check error strings for specificity


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_engage_offset(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.engage(offset=10)


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_disengage(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.disengage()


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_status(subject: MagneticModuleContext) -> None:  # noqa: D103
    _ = subject.status
