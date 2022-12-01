import json
from opentrons_shared_data.pipette import load_data, types, pipette_definition

from opentrons_shared_data import load_shared_data


def test_load_pipette_definition() -> None:
    pipette_config = load_data.load_definition(
        types.PipetteModelType.P50,
        types.PipetteChannelType.SINGLE_CHANNEL,
        types.PipetteVersionType(major=1, minor=0),
    )
    combined_dict = json.loads(
        load_shared_data("pipette/definitions/2/liquid/single_channel/p50/1_0.json")
    )
    combined_dict.update(
        json.loads(
            load_shared_data(
                "pipette/definitions/2/geometry/single_channel/p50/1_0.json"
            )
        )
    )
    combined_dict.update(
        json.loads(
            load_shared_data(
                "pipette/definitions/2/general/single_channel/p50/1_0.json"
            )
        )
    )
    converted_to_pydantic = pipette_definition.PipetteConfigurations.parse_obj(
        combined_dict
    )
    assert pipette_config.dict() == converted_to_pydantic.dict()
