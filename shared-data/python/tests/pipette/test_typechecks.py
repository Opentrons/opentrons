import typeguard

from opentrons_shared_data.pipette import model_config, name_config
from opentrons_shared_data.pipette.dev_types import (
    PipetteModelSpecs, PipetteNameSpecs)


def test_model_config_check():
    defdict = model_config()
    typeguard.check_type('defdict', defdict, PipetteModelSpecs)


def test_name_config_check():
    defdict = name_config()
    typeguard.check_type('defdict', defdict, PipetteNameSpecs)
