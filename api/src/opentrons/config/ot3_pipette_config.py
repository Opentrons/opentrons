from opentrons_shared_data.pipette import load_data
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteConfigurations,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]


def load_ot3_pipette(
    pipette_model: str, number_of_channels: int, version: float
) -> PipetteConfigurations:
    requested_model = PipetteModelType(pipette_model)
    requested_channels = PipetteChannelType(number_of_channels)
    requested_version = PipetteVersionType.convert_from_float(version)

    return load_data.load_definition(
        requested_model, requested_channels, requested_version
    )
