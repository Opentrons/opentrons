from typing import Tuple, Optional
from dataclasses import dataclass
from opentrons_shared_data.pipette import load_data
from opentrons_shared_data.pipette.dev_types import PipetteModel, PipetteName
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteGenerationType,
    PipetteConfigurations,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]
DEFAULT_MODEL = "p1000"
DEFAULT_CHANNELS = 1
DEFAULT_MODEL_VERSION = 1.0


def convert_channels_to_int(channels: str) -> int:
    if channels == "96":
        return 96
    elif channels == "multi":
        return 8
    else:
        return 1


def convert_version_to_float(version: str) -> float:
    return float(version.split("v")[1])


def convert_pipette_name(name: PipetteName) -> Tuple[str, int, float]:
    split_pipette_name = name.split("_")
    channels = convert_channels_to_int(split_pipette_name[1])
    if "gen3" in split_pipette_name:
        version = 3.0
    elif "gen2" in split_pipette_name:
        version = 2.0
    else:
        version = DEFAULT_MODEL_VERSION
    return split_pipette_name[0], channels, version


def convert_pipette_model(model: Optional[PipetteModel]) -> Tuple[str, int, float]:
    # TODO (lc 12-5-2022) This helper function is needed
    # until we stop using "name" and "model" to refer
    # to attached pipettes.
    # We need to figure out how to default the pipette model as well
    # rather than returning a p1000
    if model:
        pipette_type, channels, version = model.split("_")
        int_channels = convert_channels_to_int(channels)
        float_version = convert_version_to_float(version)
        return pipette_type, int_channels, float_version
    else:
        return DEFAULT_MODEL, DEFAULT_CHANNELS, DEFAULT_MODEL_VERSION


# TODO (lc 12-5-2022) Ideally we can deprecate this
# at somepoint once we load pipettes by channels and type
@dataclass
class PipetteNameType:
    pipette_type: PipetteModelType
    pipette_channels: PipetteChannelType
    pipette_generation: PipetteGenerationType

    def __repr__(self) -> str:
        base_name = f"{self.pipette_type.name}_{self.pipette_channels}"
        if self.pipette_generation == PipetteGenerationType.GEN1:
            return base_name
        elif self.pipette_channels == PipetteChannelType.NINETY_SIX_CHANNEL:
            return base_name
        else:
            return f"{base_name}_{self.pipette_generation.name.lower()}"


@dataclass
class PipetteModelVersionType:
    pipette_type: PipetteModelType
    pipette_channels: PipetteChannelType
    pipette_version: PipetteVersionType

    def __repr__(self) -> str:
        base_name = f"{self.pipette_type.name}_{self.pipette_channels}"

        return f"{base_name}_v{self.pipette_version}"


def load_ot3_pipette(
    pipette_model: str, number_of_channels: int, version: float
) -> PipetteConfigurations:
    requested_model = PipetteModelType(pipette_model)
    requested_channels = PipetteChannelType(number_of_channels)
    requested_version = PipetteVersionType.convert_from_float(version)

    return load_data.load_definition(
        requested_model, requested_channels, requested_version
    )
