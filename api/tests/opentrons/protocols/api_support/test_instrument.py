import pytest
from opentrons.protocol_api import ProtocolContext
from opentrons.protocols.api_support.instrument import validate_takes_liquid
from opentrons.types import Location, Point


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
