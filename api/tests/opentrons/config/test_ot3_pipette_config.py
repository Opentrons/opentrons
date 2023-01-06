import pytest

from typing import Tuple, cast
from opentrons_shared_data.pipette.pipette_definition import (
    SupportedTipsDefinition,
    PipetteTipType,
)
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteGenerationType,
    PipetteModelMajorVersionType,
    PipetteModelMinorVersionType,
)
from opentrons_shared_data.pipette.dev_types import PipetteModel, PipetteName
from opentrons.config import ot3_pipette_config as pc


def test_multiple_tip_configurations() -> None:
    model_version = pc.PipetteModelVersionType(
        PipetteModelType.p1000,
        PipetteChannelType.EIGHT_CHANNEL,
        PipetteVersionType(1, 0),
    )
    loaded_configuration = pc.load_ot3_pipette(model_version)
    assert list(loaded_configuration.supported_tips.keys()) == list(PipetteTipType)
    assert isinstance(
        loaded_configuration.supported_tips[PipetteTipType.t50],
        SupportedTipsDefinition,
    )


@pytest.mark.parametrize(
    argnames=["model", "channels", "version"],
    argvalues=[["p50", 8, (1, 0)], ["p1000", 96, (1, 0)], ["p50", 1, (1, 0)]],
)
def test_load_full_pipette_configurations(
    model: str, channels: int, version: Tuple[int, int]
) -> None:
    model_version = pc.PipetteModelVersionType(
        PipetteModelType(model),
        PipetteChannelType(channels),
        PipetteVersionType(
            cast(PipetteModelMajorVersionType, version[0]),
            cast(PipetteModelMinorVersionType, version[1]),
        ),
    )
    loaded_configuration = pc.load_ot3_pipette(model_version)
    assert loaded_configuration.pipette_type.value == model
    assert loaded_configuration.channels.as_int == channels
    assert loaded_configuration.version.as_tuple == version


@pytest.mark.parametrize(
    argnames=["model", "output"],
    argvalues=[
        [
            "p50_single_v2.0",
            pc.PipetteModelVersionType(
                PipetteModelType.p50,
                PipetteChannelType.SINGLE_CHANNEL,
                PipetteVersionType(2, 0),
            ),
        ],
        [
            "p1000_multi_v1.0",
            pc.PipetteModelVersionType(
                PipetteModelType.p1000,
                PipetteChannelType.EIGHT_CHANNEL,
                PipetteVersionType(1, 0),
            ),
        ],
        [
            "p1000_96_v1.0",
            pc.PipetteModelVersionType(
                PipetteModelType.p1000,
                PipetteChannelType.NINETY_SIX_CHANNEL,
                PipetteVersionType(1, 0),
            ),
        ],
    ],
)
def test_convert_pipette_model(
    model: PipetteModel, output: pc.PipetteModelVersionType
) -> None:
    assert output == pc.convert_pipette_model(model)


@pytest.mark.parametrize(
    argnames=["model", "version", "output"],
    argvalues=[
        [
            "p50_single",
            "2.0",
            pc.PipetteModelVersionType(
                PipetteModelType.p50,
                PipetteChannelType.SINGLE_CHANNEL,
                PipetteVersionType(2, 0),
            ),
        ],
        [
            "p1000_multi",
            "3.3",
            pc.PipetteModelVersionType(
                PipetteModelType.p1000,
                PipetteChannelType.EIGHT_CHANNEL,
                PipetteVersionType(3, 3),
            ),
        ],
        [
            "p1000_96",
            "1.1",
            pc.PipetteModelVersionType(
                PipetteModelType.p1000,
                PipetteChannelType.NINETY_SIX_CHANNEL,
                PipetteVersionType(1, 1),
            ),
        ],
    ],
)
def test_convert_pipette_model_provided_version(
    model: PipetteModel, version: str, output: pc.PipetteModelVersionType
) -> None:
    assert output == pc.convert_pipette_model(model, version)


@pytest.mark.parametrize(
    argnames=["name", "output"],
    argvalues=[
        [
            "p50_single_gen2",
            pc.PipetteModelVersionType(
                PipetteModelType.p50,
                PipetteChannelType.SINGLE_CHANNEL,
                PipetteVersionType(2, 0),
            ),
        ],
        [
            "p1000_multi_gen3",
            pc.PipetteModelVersionType(
                PipetteModelType.p1000,
                PipetteChannelType.EIGHT_CHANNEL,
                PipetteVersionType(3, 0),
            ),
        ],
        [
            "p1000_96",
            pc.PipetteModelVersionType(
                PipetteModelType.p1000,
                PipetteChannelType.NINETY_SIX_CHANNEL,
                PipetteVersionType(1, 0),
            ),
        ],
    ],
)
def test_convert_pipette_name(
    name: PipetteName, output: pc.PipetteModelVersionType
) -> None:
    assert output == pc.convert_pipette_name(name)


@pytest.mark.parametrize(
    argnames=["model_type", "channels", "generation", "output"],
    argvalues=[
        [
            PipetteModelType.p50,
            PipetteChannelType.SINGLE_CHANNEL,
            PipetteGenerationType.GEN2,
            "p50_single_gen2",
        ],
        [
            PipetteModelType.p1000,
            PipetteChannelType.EIGHT_CHANNEL,
            PipetteGenerationType.GEN2,
            "p1000_multi_gen2",
        ],
        [
            # 96 channel has a unique "name" right now
            PipetteModelType.p1000,
            PipetteChannelType.NINETY_SIX_CHANNEL,
            PipetteGenerationType.GEN3,
            "p1000_96",
        ],
    ],
)
def test_model_version_type_string_version(
    model_type: PipetteModelType,
    channels: PipetteChannelType,
    generation: PipetteGenerationType,
    output: PipetteName,
) -> None:
    data = pc.PipetteNameType(
        pipette_type=model_type,
        pipette_channels=channels,
        pipette_generation=generation,
    )
    assert output == str(data)


@pytest.mark.parametrize(
    argnames=["model_type", "channels", "version", "output"],
    argvalues=[
        [
            PipetteModelType.p50,
            PipetteChannelType.SINGLE_CHANNEL,
            PipetteVersionType(1, 0),
            "p50_single_v1.0",
        ],
        [
            PipetteModelType.p1000,
            PipetteChannelType.EIGHT_CHANNEL,
            PipetteVersionType(2, 1),
            "p1000_multi_v2.1",
        ],
        [
            PipetteModelType.p1000,
            PipetteChannelType.NINETY_SIX_CHANNEL,
            PipetteVersionType(3, 3),
            "p1000_96_v3.3",
        ],
    ],
)
def test_name_type_string_generation(
    model_type: PipetteModelType,
    channels: PipetteChannelType,
    version: PipetteVersionType,
    output: PipetteModel,
) -> None:
    data = pc.PipetteModelVersionType(
        pipette_type=model_type, pipette_channels=channels, pipette_version=version
    )
    assert output == str(data)
