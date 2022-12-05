from dataclasses import dataclass
from opentrons_shared_data.pipette import load_data
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteGenerationType,
    PipetteConfigurations,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]


# TODO (lc 12-5-2022) Ideally we can deprecate this
# at somepoint once we load pipettes by channels and type
@dataclass
class PipetteName:
    pipette_type: PipetteModelType
    pipette_channels: PipetteChannelType
    pipette_generation: PipetteGenerationType

    def __repr__(self):
        base_name = f"{self.pipette_type}_{self.pipette_channels}"
        if self.pipette_generation == PipetteGenerationType.GEN1:
            return base_name
        else:
            return f"{base_name}_{self.pipette_generation.name.lower()}"



def load_ot3_pipette(
    pipette_model: str, number_of_channels: int, version: float
) -> PipetteConfigurations:
    requested_model = PipetteModelType(pipette_model)
    requested_channels = PipetteChannelType(number_of_channels)
    requested_version = PipetteVersionType.convert_from_float(version)

    return load_data.load_definition(
        requested_model, requested_channels, requested_version
    )
