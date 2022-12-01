import pytest
import json
from opentrons_shared_data.pipette import load_data, types

from opentrons_shared_data import load_shared_data


@pytest.mark.xfail
def test_load_pipette_definition() -> None:
    # TODO we should make sure that numbers that are supposed to be floats
    # in the configuration are actually floats. For now, we will mark this
    # test as expected fail.
    pipette_config = load_data.load_definition(
        types.PipetteModelType.P50,
        types.PipetteChannelType.SINGLE_CHANNEL,
        types.PipetteVersionType(major=1, minor=0),
    )
    combined_dict = json.loads(
        load_shared_data("pipette/definitions/2/liquid/single_channel/p50/1.json")
    )
    combined_dict.update(
        json.loads(
            load_shared_data("pipette/definitions/2/geometry/single_channel/p50/1.json")
        )
    )
    combined_dict.update(
        json.loads(
            load_shared_data("pipette/definitions/2/general/single_channel/p50/1.json")
        )
    )
    assert pipette_config.dict() == combined_dict
