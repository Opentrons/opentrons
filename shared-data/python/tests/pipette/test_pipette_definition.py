import pytest
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
)


@pytest.mark.parametrize(
    argnames=["model", "expected_enum"],
    argvalues=[["p50", PipetteModelType.p50], ["p1000", PipetteModelType.p1000]],
)
def test_model_enum(model: str, expected_enum: PipetteModelType) -> None:
    assert expected_enum == PipetteModelType(model)


@pytest.mark.parametrize(argnames="channels", argvalues=[1, 8, 96])
def test_channel_enum(channels: int) -> None:
    channel_type = PipetteChannelType(channels)
    assert channels == channel_type.as_int


def test_incorrect_values() -> None:
    with pytest.raises(ValueError):
        PipetteModelType("p100")

    with pytest.raises(ValueError):
        PipetteChannelType(99)


@pytest.mark.parametrize(
    argnames=["version", "major", "minor"],
    argvalues=[[1.0, 1, 0], [1.3, 1, 3], [3.9, 3, 9]],
)
def test_version_enum(version: float, major: int, minor: int) -> None:
    version_type = PipetteVersionType.convert_from_float(version)
    assert version_type.major == major
    assert version_type.minor == minor
