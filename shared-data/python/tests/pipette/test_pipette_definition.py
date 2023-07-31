import pytest
from typing import cast
from opentrons_shared_data.pipette.types import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteModelMajorVersionType,
    PipetteModelMinorVersionType,
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
    assert channels == channel_type


def test_incorrect_values() -> None:
    with pytest.raises(ValueError):
        PipetteModelType("p100")

    with pytest.raises(ValueError):
        PipetteChannelType(99)


@pytest.mark.parametrize(
    argnames=["major", "minor"],
    argvalues=[[1, 0], [1, 3], [3, 9]],
)
def test_version_enum(major: int, minor: int) -> None:
    version_type = PipetteVersionType(
        cast(PipetteModelMajorVersionType, major),
        cast(PipetteModelMinorVersionType, minor),
    )
    assert version_type.as_tuple == (major, minor)
