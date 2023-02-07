from dataclasses import dataclass

from opentrons_shared_data.pipette import dummy_model_for_name
from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel

from opentrons.config.pipette_config import load as load_pipette_config, PipetteConfig

from ..types import FlowRates


@dataclass(frozen=True)
class LoadedStaticPipetteData:
    model: str
    min_volume: float
    max_volume: float
    channels: int
    flow_rates: FlowRates


def _return_static_pipette_data(config: PipetteConfig) -> LoadedStaticPipetteData:
    return LoadedStaticPipetteData(
        model=config.model,
        min_volume=config.min_volume,
        max_volume=config.max_volume,
        channels=int(config.channels),
        flow_rates=FlowRates(
            default_blow_out=config.default_blow_out_flow_rates,
            default_aspirate=config.default_aspirate_flow_rates,
            default_dispense=config.default_dispense_flow_rates,
        ),
    )


def get_virtual_pipette_static_config(
    pipette_name: PipetteName,
) -> LoadedStaticPipetteData:
    pipette_model = dummy_model_for_name(pipette_name)
    config = load_pipette_config(pipette_model)
    return _return_static_pipette_data(config)


def get_pipette_static_config(
    pipette_model: PipetteModel, pipette_id: str
) -> LoadedStaticPipetteData:
    config = load_pipette_config(pipette_model, pipette_id)
    return _return_static_pipette_data(config)
