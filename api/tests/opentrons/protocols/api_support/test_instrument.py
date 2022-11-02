from unittest import mock

import pytest
from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.labware import Labware, Well
from opentrons.protocols.api_support.instrument import (
    determine_drop_target,
    validate_takes_liquid,
)
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocol_api.core.protocol_api.well import WellImplementation
from opentrons.protocols.api_support.types import APIVersion
from opentrons.types import Location, Point


@pytest.mark.parametrize(
    argnames=["api_version", "expected_point"],
    argvalues=[
        # Above version_breakpoint:
        #  subtract return_height (0.5) * tip_length (1)
        #  from z (15)
        [APIVersion(2, 3), Point(10, 10, 14.5)],
        # Below version_breakpoint:
        #  add 10 to bottom (10)
        [APIVersion(2, 0), Point(10, 10, 20)],
    ],
)
def test_determine_drop_target(api_version, expected_point):
    lw_mock = mock.MagicMock()
    lw_mock.is_tiprack = mock.MagicMock(return_value=True)
    lw_mock.get_tip_length = mock.MagicMock(return_value=1)
    well = Well(
        parent=Labware(implementation=lw_mock),
        well_implementation=WellImplementation(
            well_geometry=WellGeometry(
                well_props={
                    "shape": "circular",
                    "depth": 5,
                    "totalLiquidVolume": 0,
                    "x": 10,
                    "y": 10,
                    "z": 10,
                    "diameter": 5,
                },
                parent_point=Point(0, 0, 0),
                parent_object=lw_mock,
            ),
            display_name="",
            has_tip=False,
            name="A1",
        ),
        api_version=api_version,
    )
    r = determine_drop_target(api_version, well, 0.5)
    assert r.labware.object == well
    assert r.point == expected_point


@pytest.mark.parametrize("reject_module", [True, False])
def test_validate_takes_liquid(ctx: ProtocolContext, reject_module: bool) -> None:
    well_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", 1)
    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 2)

    validate_takes_liquid(
        location=Location(Point(1, 2, 3), None),
        reject_module=reject_module,
    )
    validate_takes_liquid(
        location=Location(Point(1, 2, 3), well_plate),
        reject_module=reject_module,
    )
    validate_takes_liquid(
        location=Location(Point(1, 2, 3), well_plate.wells()[0]),
        reject_module=reject_module,
    )
    validate_takes_liquid(
        location=well_plate.wells()[0].top(),
        reject_module=reject_module,
    )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to a tip rack"):
        validate_takes_liquid(
            location=Location(Point(1, 2, 3), tip_rack),
            reject_module=reject_module,
        )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to a tip rack"):
        validate_takes_liquid(
            location=Location(Point(1, 2, 3), tip_rack.wells()[0]),
            reject_module=reject_module,
        )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to a tip rack"):
        validate_takes_liquid(
            location=tip_rack.wells_by_name()["A1"].top(),
            reject_module=reject_module,
        )


def test_validate_takes_liquid_module_location(ctx):
    module = ctx.load_module("magdeck", 1)

    validate_takes_liquid(
        location=module.geometry.location,
        reject_module=False,
    )

    with pytest.raises(
        ValueError,
        match="Cannot aspirate/dispense directly to a module",
    ):
        validate_takes_liquid(
            location=module.geometry.location,
            reject_module=True,
        )
