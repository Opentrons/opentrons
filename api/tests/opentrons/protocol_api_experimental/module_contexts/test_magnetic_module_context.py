"""Tests for `magnetic_module_context`."""


from typing import cast

from decoy import Decoy
import pytest

from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine import (
    ModuleLocation,
    ModuleModel,
    commands as pe_commands,
)
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
    # These [call-overload] ignores are because the type-checker wants to stop us
    # from miscalling this function, but we need to test that the function protects
    # itself when there is no type-checker.

    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, height_from_base=2, offset=3)  # type: ignore[call-overload]  # noqa: E501
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, height_from_base=2)  # type: ignore[call-overload]
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, offset=3)  # type: ignore[call-overload]
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height_from_base=2, offset=3)  # type: ignore[call-overload]

    # Explicitly providing an offset value of 0 is intuitively equivalent to not
    # providing any offset, but it should still be mutually exclusive with other args.
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=123, offset=0)  # type: ignore[call-overload]
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height_from_base=123, offset=0)  # type: ignore[call-overload]


def test_engage_with_height_from_home(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should pass the correct height to the Protocol Engine command."""
    decoy.when(
        engine_client.state.modules.get_model(module_id=subject_module_id)
    ).then_return(ModuleModel.MAGNETIC_MODULE_V1)
    decoy.when(
        engine_client.state.modules.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V1,
            hardware_units_above_home=12.34,
        )
    ).then_return(56.78)
    subject.engage(height=12.34)
    decoy.verify(
        engine_client.magnetic_module_engage(
            module_id=subject_module_id, engage_height=56.78
        ),
    )


def test_engage_with_height_from_base(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should pass the correct height to the Protocol Engine command."""
    decoy.when(
        engine_client.state.modules.get_model(module_id=subject_module_id)
    ).then_return(ModuleModel.MAGNETIC_MODULE_V1)
    decoy.when(
        engine_client.state.modules.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V1,
            hardware_units_above_base=12.34,
        )
    ).then_return(56.78)
    subject.engage(height_from_base=12.34)
    decoy.verify(
        engine_client.magnetic_module_engage(
            module_id=subject_module_id, engage_height=56.78
        )
    )


def test_engage_with_offset(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should use the offset combined with the labware's default engage height."""
    decoy.when(
        engine_client.state.modules.get_model(module_id=subject_module_id)
    ).then_return(ModuleModel.MAGNETIC_MODULE_V1)
    decoy.when(
        engine_client.state.labware.get_id_by_module(module_id=subject_module_id)
    ).then_return("labware-id")
    decoy.when(
        engine_client.state.labware.get_magnet_engage_height_above_base_true_mm(
            labware_id="labware-id"
        )
    ).then_return(1.23)
    decoy.when(
        engine_client.state.modules.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V1,
            labware_default_true_mm_above_base=1.23,
            hardware_units_above_labware_default=4.56,
        )
    ).then_return(7.89)
    subject.engage(offset=4.56)
    decoy.verify(
        engine_client.magnetic_module_engage(
            module_id=subject_module_id, engage_height=7.89
        )
    )


def test_engage_with_no_arguments(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should use the default engage height from the labware."""
    decoy.when(
        engine_client.state.modules.get_model(module_id=subject_module_id)
    ).then_return(ModuleModel.MAGNETIC_MODULE_V1)
    decoy.when(
        engine_client.state.labware.get_id_by_module(module_id=subject_module_id)
    ).then_return("labware-id")
    decoy.when(
        engine_client.state.labware.get_magnet_engage_height_above_base_true_mm(
            labware_id="labware-id"
        )
    ).then_return(1.23)
    decoy.when(
        engine_client.state.modules.calculate_magnet_true_mm_above_base(
            module_model=ModuleModel.MAGNETIC_MODULE_V1,
            labware_default_true_mm_above_base=1.23,
            hardware_units_above_labware_default=0,
        )
    ).then_return(7.89)
    subject.engage()
    decoy.verify(
        engine_client.magnetic_module_engage(
            module_id=subject_module_id, engage_height=7.89
        )
    )


def test_engage_based_on_labware_errors_when_no_labware_loaded(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should raise when there is no labware loaded on the module."""
    decoy.when(
        engine_client.state.labware.get_id_by_module(module_id=subject_module_id)
    ).then_return(None)
    expected_exception_text = "no labware loaded"
    with pytest.raises(InvalidMagnetEngageHeightError, match=expected_exception_text):
        subject.engage(offset=1.23)
    with pytest.raises(InvalidMagnetEngageHeightError, match=expected_exception_text):
        subject.engage(offset=0)
    with pytest.raises(InvalidMagnetEngageHeightError, match=expected_exception_text):
        subject.engage()


def test_engage_based_on_labware_errors_when_labware_has_no_default_height(
    decoy: Decoy,
    engine_client: SyncClient,
    subject_module_id: str,
    subject: MagneticModuleContext,
) -> None:
    """It should raise when there is a labware, but it has no default magnet height."""
    decoy.when(
        engine_client.state.labware.get_id_by_module(module_id=subject_module_id)
    ).then_return("labware-id")
    decoy.when(
        engine_client.state.labware.get_magnet_engage_height_above_base_true_mm(
            labware_id="labware-id"
        )
    ).then_return(None)
    expected_exception_text = "does not have a default"
    with pytest.raises(InvalidMagnetEngageHeightError, match=expected_exception_text):
        subject.engage(offset=1.23)
    with pytest.raises(InvalidMagnetEngageHeightError, match=expected_exception_text):
        subject.engage(offset=0)
    with pytest.raises(InvalidMagnetEngageHeightError, match=expected_exception_text):
        subject.engage()


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_disengage(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.disengage()


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_status(subject: MagneticModuleContext) -> None:  # noqa: D103
    _ = subject.status
