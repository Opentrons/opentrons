"""
opentrons_shared_data.pipette: functions and types for pipette config
"""

from functools import lru_cache
from typing import TYPE_CHECKING
import json

from .. import load_shared_data

if TYPE_CHECKING:
    from .dev_types import (PipetteNameSpecs, PipetteModelSpecs,
                            PipetteName, PipetteModel)


@lru_cache(1)
def model_config() -> 'PipetteModelSpecs':
    """ Load the per-pipette-model config file from within the wheel """
    return json.loads(
        load_shared_data('pipette/definitions/pipetteModelSpecs.json')
        or '{}')


@lru_cache(1)
def name_config() -> 'PipetteNameSpecs':
    """ Load the per-pipette-name config file from within the wheel """
    return json.loads(
        load_shared_data('pipette/definitions/pipetteNameSpecs.json')
        or '{}')


def name_for_model(pipette_model: 'PipetteModel') -> 'PipetteName':
    return model_config()['config'][pipette_model]['name']
