import json
from opentrons_shared_data.pipette import load_data, types

from opentrons_shared_data import load_shared_data


def test_load_pipette_definition() -> None:
    pipette_config = load_data.load_definition(
        types.PipetteModelType.P50,
        types.PipetteChannelType.SINGLE_CHANNEL,
        types.PipetteVersionType(major=1, minor=0),
    )
    liquid = json.loads(
        load_shared_data("pipette/definitions/2/liquid/single_channel/p50/1_0.json")
    )
    geometry = json.loads(
        load_shared_data("pipette/definitions/2/geometry/single_channel/p50/1_0.json")
    )
    general = json.loads(
        load_shared_data("pipette/definitions/2/general/single_channel/p50/1_0.json")
    )

    assert pipette_config.channels.as_int == general["channels"]
    assert pipette_config.pipette_type.value == general["model"]
    assert pipette_config.nozzle_offset == geometry["nozzleOffset"]

    assert (
        pipette_config.supported_tips[
            types.PipetteTipType.t50
        ].default_aspirate_flowrate
        == liquid["supportedTips"]["t50"]["defaultAspirateFlowRate"]
    )
