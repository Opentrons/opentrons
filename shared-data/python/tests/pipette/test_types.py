import pytest
from opentrons_shared_data.pipette.types import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    UnsupportedNumberOfChannels,
)


@pytest.mark.parametrize(
    argnames=["model", "expected_enum"],
    argvalues=[["p50", PipetteModelType.P50], ["p1000", PipetteModelType.P1000]],
)
def test_model_enum(model: str, expected_enum: PipetteModelType) -> None:
    assert expected_enum == PipetteModelType.convert_from_model(model)


@pytest.mark.parametrize(argnames="channels", argvalues=[1, 8, 96])
def test_channel_enum(channels: int) -> None:
    channel_type = PipetteChannelType.convert_from_channels(channels)
    assert channels == channel_type.as_int


def test_incorrect_values() -> None:
    with pytest.raises(KeyError):
        PipetteModelType.convert_from_model("p100")

    with pytest.raises(UnsupportedNumberOfChannels):
        PipetteChannelType.convert_from_channels(99)


@pytest.mark.parametrize(
    argnames=["version", "major", "minor"],
    argvalues=[[1.0, 1, 0], [1.3, 1, 3], [3.9, 3, 9]],
)
def test_version_enum(version: float, major: int, minor: int) -> None:
    version_type = PipetteVersionType.convert_from_float(version)
    conversion_test = round(version % 1, 2)
    print(conversion_test)
    assert version_type.major == major
    assert version_type.minor == minor
