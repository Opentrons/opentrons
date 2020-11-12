from unittest import mock

import pytest
from opentrons.protocol_api.labware import Well
from opentrons.protocols.api_support.instrument import determine_drop_target
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.api_support.types import APIVersion
from opentrons.types import Point


@pytest.mark.parametrize(argnames=["api_version", "expected_point"],
                         argvalues=[
                             # Above version_breakpoint:
                             #  subtract return_height (0.5) * tip_length (1)
                             #  from z (15)
                             [APIVersion(2, 3), Point(10, 10, 14.5)],
                             # Below version_breakpoint:
                             #  add 10 to bottom (10)
                             [APIVersion(2, 0), Point(10, 10, 20)],
                         ])
def test_determine_drop_target(
        api_version,
        expected_point):
    lw_mock = mock.MagicMock()
    lw_mock.is_tiprack = mock.MagicMock(return_value=True)
    lw_mock.get_tip_length = mock.MagicMock(return_value=1)
    well = Well(
        well_implementation=WellImplementation(
            well_geometry=WellGeometry(
                well_props={
                    'shape': 'circular',
                    'depth': 5,
                    'totalLiquidVolume': 0,
                    'x': 10,
                    'y': 10,
                    'z': 10,
                    'diameter': 5,
                },
                parent_point=Point(0, 0, 0),
                parent_object=lw_mock),
            display_name="",
            has_tip=False,
            name="A1",
        ),
        api_level=api_version
    )
    r = determine_drop_target(api_version, well, 0.5)
    assert r.labware.object == well
    assert r.point == expected_point
