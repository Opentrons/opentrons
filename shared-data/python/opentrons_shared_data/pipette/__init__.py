from __future__ import annotations
"""
opentrons_shared_data.pipette: functions and types for pipette config
"""
import copy
from typing import TYPE_CHECKING
import json

from .. import load_shared_data

if TYPE_CHECKING:
    from .dev_types import (PipetteNameSpecs, PipetteModelSpecs,
                            PipetteName, PipetteModel, PipetteFusedSpec)


def model_config() -> PipetteModelSpecs:
    """ Load the per-pipette-model config file from within the wheel """
    return json.loads(
        load_shared_data('pipette/definitions/pipetteModelSpecs.json')
        or '{}')


def name_config() -> PipetteNameSpecs:
    """ Load the per-pipette-name config file from within the wheel """
    return json.loads(
        load_shared_data('pipette/definitions/pipetteNameSpecs.json')
        or '{}')


def name_for_model(pipette_model: PipetteModel) -> PipetteName:
    """ Quickly look up the name for this model """
    return model_config()['config'][pipette_model]['name']


def fuse_specs(
        pipette_model: PipetteModel,
        pipette_name: PipetteName = None) -> PipetteFusedSpec:
    """ Combine the model and name spec for a given model.

    if pipette_name is not given, the name field of the pipette config
    is used. If it is, the given name must be in the backCompatNames field.
    """

    model_data = model_config()['config'][pipette_model]
    pipette_name = pipette_name or model_data['name']

    valid_names = [model_data['name']] + model_data.get('backCompatNames', [])

    if pipette_name not in valid_names:
        raise KeyError(
            f'pipette name {pipette_name} is not valid for model '
            f'{pipette_model}')
    name_data = name_config()[pipette_name]

    # unfortunately, mypy can't verify this way to build typed dicts - we'll
    # make sure it's correct in the tests, and leave the function annotated
    # properly
    new_model = copy.deepcopy(model_data)
    new_name = copy.deepcopy(name_data)
    return {**new_model, **new_name}  # type: ignore


def dummy_model_for_name(pipette_name: PipetteName) -> PipetteModel:
    if 'gen2' in pipette_name:
        return '_'.join(pipette_name.split('_')[:-1]) + '_v2.0'
    else:
        return pipette_name + '_v1'
