"""Tests for `magnetic_module_context`."""


import pytest

from opentrons.protocol_api_experimental import (
    MagneticModuleContext,
    InvalidMagnetEngageHeightError,
)


@pytest.fixture
def subject() -> MagneticModuleContext:
    """Return a MagneticModuleContext to test."""
    return MagneticModuleContext(module_id="module-id")


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_api_version(subject: MagneticModuleContext) -> None:  # noqa: D103
    _ = subject.api_version


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_load_labware(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.load_labware("my_load_name")


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_load_labware_from_definition(  # noqa: D103
    subject: MagneticModuleContext,
) -> None:
    subject.load_labware_from_definition(definition={})  # type: ignore[typeddict-item]


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_load_labware_object(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.load_labware_object(labware=None)  # type: ignore[arg-type]


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_labware_property(subject: MagneticModuleContext) -> None:  # noqa: D103
    _ = subject.labware


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_engage(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.engage(10)


def test_engage_only_one_height_allowed(subject: MagneticModuleContext) -> None:
    """It should raise if you provide conflicting height arguments."""
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, height_from_base=2, offset=3)
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, height_from_base=2)
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height=1, offset=3)
    with pytest.raises(InvalidMagnetEngageHeightError):
        subject.engage(height_from_base=2, offset=3)


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_disengage(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.disengage()


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_status(subject: MagneticModuleContext) -> None:  # noqa: D103
    _ = subject.status


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_calibrate(subject: MagneticModuleContext) -> None:  # noqa: D103
    subject.calibrate()
