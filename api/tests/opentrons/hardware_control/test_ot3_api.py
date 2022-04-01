""" Tests for behaviors specific to the OT3 hardware controller.
"""
from typing import cast
import pytest
from opentrons.config.types import GantryLoad
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.types import OT3Mount
from opentrons.hardware_control.ot3api import OT3API


@pytest.mark.parametrize(
    "attached,load",
    (
        (
            {OT3Mount.RIGHT: {"channels": 8}, OT3Mount.LEFT: {"channels": 1}},
            GantryLoad.TWO_LOW_THROUGHPUT,
        ),
        ({}, GantryLoad.NONE),
        ({OT3Mount.LEFT: {"channels": 1}}, GantryLoad.LOW_THROUGHPUT),
        ({OT3Mount.RIGHT: {"channels": 8}}, GantryLoad.LOW_THROUGHPUT),
        ({OT3Mount.RIGHT: {"channels": 96}}, GantryLoad.HIGH_THROUGHPUT),
    ),
)
def test_gantry_load_transform(attached, load):
    assert OT3API._gantry_load_from_instruments(cast(PipetteDict, attached)) == load
