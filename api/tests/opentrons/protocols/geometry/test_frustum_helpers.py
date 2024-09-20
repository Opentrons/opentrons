import pytest
from math import pi, sqrt
from typing import Any, List

# make some fake frusta
from opentrons_shared_data.labware.types import (
    WellDefinition,
    RectangularBoundedSection,
    CircularBoundedSection,
    SphericalSegment,
)
from opentrons.protocol_engine.state.frustum_helpers import (
    cross_section_area_rectangular,
    cross_section_area_circular,
    reject_unacceptable_heights,
)
from opentrons.protocol_engine.errors.exceptions import InvalidLiquidHeightFound


@pytest.mark.parametrize(
    ["max_height", "potential_heights", "expected_heights"],
    [
        (34, [complex(4, 5), complex(5, 0), 35, 34, 33, 10, 0], [5, 34, 33, 10, 0]),
        (2934, [complex(4, 5), complex(5, 0)], [5]),
        (100, [-99, -1, complex(99.99, 0), 101], [99.99]),
        (2, [0, -1, complex(-1.5, 0)], [0]),
        (8, [complex(7, 1), -0.01], []),
    ],
)
def test_reject_unacceptable_heights(
    max_height: float, potential_heights: List[Any], expected_heights: List[float]
) -> None:
    if len(expected_heights) != 1:
        with pytest.raises(InvalidLiquidHeightFound):
            reject_unacceptable_heights(
                max_height=max_height, potential_heights=potential_heights
            )
    else:
        found_heights = reject_unacceptable_heights(
            max_height=max_height, potential_heights=potential_heights
        )
        assert found_heights == expected_heights[0]


@pytest.mark.parametrize("diameter", [2, 5, 8, 356, 1000])
def test_cross_section_area_circular(diameter: float) -> None:
    expected_area = pi * (diameter / 2) ** 2
    assert cross_section_area_circular(diameter) == expected_area


@pytest.mark.parametrize(
    ["x_dimension", "y_dimension"], [(1, 38402), (234, 983), (94857, 40), (234, 999)]
)
def test_cross_section_area_rectangular(x_dimension: float, y_dimension: float) -> None:
    expected_area = x_dimension * y_dimension
    assert (
        cross_section_area_rectangular(x_dimension=x_dimension, y_dimension=y_dimension)
        == expected_area
    )


def fake_frusta() -> List[List[Any]]:
    frusta = []
    frusta.append(
        [
            RectangularBoundedSection(
                shape="rectangular", xDimension=9.0, yDimension=10.0, topHeight=10.0
            ),
            RectangularBoundedSection(
                shape="rectangular", xDimension=8.0, yDimension=9.0, topHeight=5.0
            ),
            CircularBoundedSection(shape="circular", diameter=23.0, topHeight=1.0),
            SphericalSegment(shape="spherical", radiusOfCurvature=4.0, depth=1.0),
        ]
    )
    frusta.append(
        [
            RectangularBoundedSection(
                shape="rectangular", xDimension=8.0, yDimension=70.0, topHeight=3.5
            ),
            RectangularBoundedSection(
                shape="rectangular", xDimension=8.0, yDimension=75.0, topHeight=2.0
            ),
            RectangularBoundedSection(
                shape="rectangular", xDimension=8.0, yDimension=80.0, topHeight=1.0
            ),
            RectangularBoundedSection(
                shape="rectangular", xDimension=8.0, yDimension=90.0, topHeight=0.0
            ),
        ]
    )
    frusta.append(
        [
            CircularBoundedSection(shape="circular", diameter=23.0, topHeight=7.5),
            CircularBoundedSection(shape="circular", diameter=11.5, topHeight=5.0),
            CircularBoundedSection(shape="circular", diameter=23.0, topHeight=2.5),
            CircularBoundedSection(shape="circular", diameter=11.5, topHeight=0.0),
        ]
    )
    frusta.append(
        [
            CircularBoundedSection(shape="circular", diameter=4.0, topHeight=3.0),
            CircularBoundedSection(shape="circular", diameter=5.0, topHeight=2.0),
            SphericalSegment(shape="spherical", radiusOfCurvature=3.5, depth=2.0),
        ]
    )
    frusta.append(
        [SphericalSegment(shape="spherical", radiusOfCurvature=4.0, depth=3.0)]
    )
    frusta.append(
        [
            RectangularBoundedSection(
                shape="rectangular", xDimension=27.0, yDimension=36.0, topHeight=0.0
            ),
            RectangularBoundedSection(
                shape="rectangular", xDimension=36.0, yDimension=26.0, topHeight=0.0
            ),
            SphericalSegment(shape="spherical", radiusOfCurvature=4.0, depth=1.5),
        ]
    )
    return frusta


# cross_section_circle test
# cross rectangle test
# volume of a frustum formula test
# polynomial roots test circular
# polynomial roots test rectangular
# volume from height circular
# volume from height rectangular
# volume from height spherical
# height from volume circular
# height from volume rectangular
# height from volume spherical
