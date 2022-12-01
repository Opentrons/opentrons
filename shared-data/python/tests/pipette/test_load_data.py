<<<<<<< HEAD
=======
import json
>>>>>>> pr change requests
from opentrons_shared_data.pipette import load_data
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteTipType,
)
<<<<<<< HEAD
=======

from opentrons_shared_data import load_shared_data
>>>>>>> pr change requests


def test_load_pipette_definition() -> None:
    pipette_config = load_data.load_definition(
        PipetteModelType.p50,
        PipetteChannelType.SINGLE_CHANNEL,
        PipetteVersionType(major=1, minor=0),
<<<<<<< HEAD
=======
    )
    liquid = json.loads(
        load_shared_data("pipette/definitions/2/liquid/single_channel/p50/1_0.json")
    )
    geometry = json.loads(
        load_shared_data("pipette/definitions/2/geometry/single_channel/p50/1_0.json")
    )
    general = json.loads(
        load_shared_data("pipette/definitions/2/general/single_channel/p50/1_0.json")
>>>>>>> pr change requests
    )

    assert pipette_config.channels.as_int == 1
    assert pipette_config.pipette_type.value == "p50"
    assert pipette_config.nozzle_offset == [-8.0, -22.0, -259.15]

    assert (
        pipette_config.supported_tips[PipetteTipType.t50].default_aspirate_flowrate
<<<<<<< HEAD
        == 8.0
=======
        == liquid["supportedTips"]["t50"]["defaultAspirateFlowRate"]
>>>>>>> pr change requests
    )
