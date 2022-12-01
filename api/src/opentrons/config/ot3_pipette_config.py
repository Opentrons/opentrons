from opentrons_shared_data.pipette import load_data, pipette_definition
from opentrons_shared_data.pipette.types import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]


def load_ot3_pipette(
    pipette_model: str, number_of_channels: int, version: float
) -> pipette_definition.PipetteConfigurations:
    requested_model = PipetteModelType.convert_from_model(pipette_model)
    requested_channels = PipetteChannelType.convert_from_channels(number_of_channels)
    requested_version = PipetteVersionType.convert_from_float(version)

    return load_data.load_definition(
        requested_model, requested_channels, requested_version
    )
