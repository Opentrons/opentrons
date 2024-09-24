import pytest
from math import pi, sqrt, isclose
from typing import Any, List

from opentrons_shared_data.labware.types import (
    RectangularBoundedSection,
    CircularBoundedSection,
    SphericalSegment,
)
from opentrons.protocol_engine.state.frustum_helpers import (
    cross_section_area_rectangular,
    cross_section_area_circular,
    reject_unacceptable_heights,
    get_boundary_pairs,
    get_cross_section_area,
    volume_from_frustum_formula,
    circular_frustum_polynomial_roots,
    rectangular_frustum_polynomial_roots,
    volume_from_height_rectangular,
    volume_from_height_circular,
    volume_from_height_spherical,
    height_from_volume_circular,
    height_from_volume_rectangular,
    height_from_volume_spherical,
)
from opentrons.protocol_engine.errors.exceptions import InvalidLiquidHeightFound


def fake_frusta() -> List[List[Any]]:
    """A bunch of weird fake well shapes."""
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
                shape="rectangular", xDimension=27.0, yDimension=36.0, topHeight=3.5
            ),
            RectangularBoundedSection(
                shape="rectangular", xDimension=36.0, yDimension=26.0, topHeight=1.5
            ),
            SphericalSegment(shape="spherical", radiusOfCurvature=4.0, depth=1.5),
        ]
    )
    return frusta


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
    """Make sure we reject all mathematical solutions that are physically not possible."""
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
    """Test circular area calculation."""
    expected_area = pi * (diameter / 2) ** 2
    assert cross_section_area_circular(diameter) == expected_area


@pytest.mark.parametrize(
    ["x_dimension", "y_dimension"], [(1, 38402), (234, 983), (94857, 40), (234, 999)]
)
def test_cross_section_area_rectangular(x_dimension: float, y_dimension: float) -> None:
    """Test rectangular area calculation."""
    expected_area = x_dimension * y_dimension
    assert (
        cross_section_area_rectangular(x_dimension=x_dimension, y_dimension=y_dimension)
        == expected_area
    )


@pytest.mark.parametrize("well", fake_frusta())
def test_get_cross_section_boundaries(well: List[List[Any]]) -> None:
    """Make sure get_cross_section_boundaries returns the expected list indices."""
    i = 0
    for f, next_f in get_boundary_pairs(well):
        assert f == well[i]
        assert next_f == well[i + 1]
        i += 1


@pytest.mark.parametrize("well", fake_frusta())
def test_frustum_formula_volume(well: List[Any]) -> None:
    """Test volume-of-a-frustum formula calculation."""
    for f, next_f in get_boundary_pairs(well):
        if f["shape"] == "spherical" or next_f["shape"] == "spherical":
            # not going to use formula on spherical segments
            continue
        f_area = get_cross_section_area(f)
        next_f_area = get_cross_section_area(next_f)
        frustum_height = next_f["topHeight"] - f["topHeight"]
        expected_volume = (f_area + next_f_area + sqrt(f_area * next_f_area)) * (
            frustum_height / 3
        )
        found_volume = volume_from_frustum_formula(
            area_1=f_area, area_2=next_f_area, height=frustum_height
        )
        assert found_volume == expected_volume


@pytest.mark.parametrize("well", fake_frusta())
def test_volume_and_height_circular(well: List[Any]) -> None:
    """Test both volume and height calculations for circular frusta."""
    if well[-1]["shape"] == "spherical":
        return
    total_height = well[0]["topHeight"]
    for f, next_f in get_boundary_pairs(well):
        if f["shape"] == next_f["shape"] == "circular":
            top_radius = next_f["diameter"] / 2
            bottom_radius = f["diameter"] / 2
            a = pi * ((top_radius - bottom_radius) ** 2) / (3 * total_height**2)
            b = pi * bottom_radius * (top_radius - bottom_radius) / total_height
            c = pi * bottom_radius**2
            assert circular_frustum_polynomial_roots(
                top_radius=top_radius,
                bottom_radius=bottom_radius,
                total_frustum_height=total_height,
            ) == (a, b, c)
            # test volume within a bunch of arbitrary heights
            for target_height in range(round(total_height)):
                expected_volume = (
                    a * (target_height**3)
                    + b * (target_height**2)
                    + c * target_height
                )
                found_volume = volume_from_height_circular(
                    target_height=target_height,
                    total_frustum_height=total_height,
                    bottom_radius=bottom_radius,
                    top_radius=top_radius,
                )
                assert found_volume == expected_volume
                # test going backwards to get height back
                found_height = height_from_volume_circular(
                    volume=found_volume,
                    total_frustum_height=total_height,
                    bottom_radius=bottom_radius,
                    top_radius=top_radius,
                )
                assert isclose(found_height, target_height)


@pytest.mark.parametrize("well", fake_frusta())
def test_volume_and_height_rectangular(well: List[Any]) -> None:
    """Test both volume and height calculations for rectangular frusta."""
    if well[-1]["shape"] == "spherical":
        return
    total_height = well[0]["topHeight"]
    for f, next_f in get_boundary_pairs(well):
        if f["shape"] == next_f["shape"] == "rectangular":
            top_length = next_f["yDimension"]
            top_width = next_f["xDimension"]
            bottom_length = f["yDimension"]
            bottom_width = f["xDimension"]
            a = (
                (top_length - bottom_length)
                * (top_width - bottom_width)
                / (3 * total_height**2)
            )
            b = (
                (bottom_length * (top_width - bottom_width))
                + (bottom_width * (top_length - bottom_length))
            ) / (2 * total_height)
            c = bottom_length * bottom_width
            assert rectangular_frustum_polynomial_roots(
                top_length=top_length,
                bottom_length=bottom_length,
                top_width=top_width,
                bottom_width=bottom_width,
                total_frustum_height=total_height,
            ) == (a, b, c)
            # test volume within a bunch of arbitrary heights
            for target_height in range(round(total_height)):
                expected_volume = (
                    a * (target_height**3)
                    + b * (target_height**2)
                    + c * target_height
                )
                found_volume = volume_from_height_rectangular(
                    target_height=target_height,
                    total_frustum_height=total_height,
                    bottom_length=bottom_length,
                    bottom_width=bottom_width,
                    top_length=top_length,
                    top_width=top_width,
                )
                assert found_volume == expected_volume
                # test going backwards to get height back
                found_height = height_from_volume_rectangular(
                    volume=found_volume,
                    total_frustum_height=total_height,
                    bottom_length=bottom_length,
                    bottom_width=bottom_width,
                    top_length=top_length,
                    top_width=top_width,
                )
                assert isclose(found_height, target_height)


@pytest.mark.parametrize("well", fake_frusta())
def test_volume_and_height_spherical(well: List[Any]) -> None:
    """Test both volume and height calculations for spherical segments."""
    if well[0]["shape"] == "spherical":
        for target_height in range(round(well[0]["depth"])):
            expected_volume = (
                (1 / 3)
                * pi
                * (target_height**2)
                * (3 * well[0]["radiusOfCurvature"] - target_height)
            )
            found_volume = volume_from_height_spherical(
                target_height=target_height,
                radius_of_curvature=well[0]["radiusOfCurvature"],
            )
            assert found_volume == expected_volume
            found_height = height_from_volume_spherical(
                volume=found_volume,
                radius_of_curvature=well[0]["radiusOfCurvature"],
                total_frustum_height=well[0]["depth"],
            )
            assert isclose(found_height, target_height)


# test that volumetric capacity is always sorted
# test that errors are raised every time and only when given invalid height values for volume_from_height
# test that errors are raised every time and only when given invalid volume values for height_from_volume
