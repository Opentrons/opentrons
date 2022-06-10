import sys
from typing import Iterator, Tuple

import pytest
import typeguard

from opentrons_shared_data.gripper import (
    model_config,
    name_config,
    fuse_specs,
    dummy_model_for_name,
)

from opentrons_shared_data.gripper.dev_types import (
    GripperModelSpecs,
    GripperNameSpecs,
    GripperFusedSpec,
    GripperModel,
    GripperName,
)

pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


def test_model_config_check() -> None:
    defdict = model_config()
    typeguard.check_type("defdict", defdict, GripperModelSpecs)


def test_name_config_check() -> None:
    defdict = name_config()
    typeguard.check_type("defdict", defdict, GripperNameSpecs)


def build_model_name_pairs() -> Iterator[Tuple[GripperModel, GripperName]]:
    for model, conf in model_config()["config"].items():
        yield model, conf["name"]


@pytest.mark.parametrize("model,name", list(build_model_name_pairs()))
def test_fuse(model: GripperModel, name: GripperName) -> None:
    defdict = fuse_specs(model, name)
    typeguard.check_type("defdict", defdict, GripperFusedSpec)


@pytest.mark.parametrize("name", list(name_config().keys()))
def test_model_for_name(name: GripperName) -> None:
    model = dummy_model_for_name(name)
    assert model in model_config()["config"]
