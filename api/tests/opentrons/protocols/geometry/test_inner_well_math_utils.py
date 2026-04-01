from math import isclose, pi
from typing import Any, Dict, List, cast

import pytest
from hypothesis import given
from hypothesis import strategies as st

from opentrons_shared_data.labware.labware_definition import (
    ConicalFrustum,
    CuboidalFrustum,
    HeightVolumePair,
    InnerWellGeometry,
    SphericalSegment,
    UserDefinedVolumes,
)

from opentrons.protocol_engine.errors.exceptions import InvalidLiquidHeightFound
from opentrons.protocol_engine.state.inner_well_math_utils import (
    _cross_section_area_circular,
    _cross_section_area_rectangular,
    _get_segment_capacity,
    _height_from_volume_circular,
    _height_from_volume_rectangular,
    _height_from_volume_spherical,
    _rectangular_frustum_polynomial_roots,
    _reject_unacceptable_heights,
    _volume_from_height_circular,
    _volume_from_height_rectangular,
    _volume_from_height_spherical,
    find_height_inner_well_geometry,
    find_height_user_defined_volumes,
    find_volume_inner_well_geometry,
    find_volume_user_defined_volumes,
)


@pytest.fixture
def user_defined_volumes_params() -> Dict[str, Any]:
    """Return a UserDefinedVolumes BaseModel."""
    params = {}
    params["obj"] = UserDefinedVolumes(
        heightToVolumeMap=[
            HeightVolumePair(height=0.4, volume=2.0),
            HeightVolumePair(height=2.3, volume=9.8),
            HeightVolumePair(height=4.5, volume=12.2),
            HeightVolumePair(height=7.8, volume=50.1),
        ]
    )
    params["volume_inputs_expected_outputs"] = [  # type: ignore[assignment]
        (0.2, 1.0),
        (2.1, 8.9789),
        (2.5, 10.01818),
        (4.5, 12.2),
        (6.0, 29.42727),
    ]
    params["height_inputs_expected_outputs"] = [  # type: ignore[assignment]
        (0.4, 0.08),
        (5.5, 1.2525),
        (9.8, 2.3),
        (0.0, 0.0),
        (50.1, 7.8),
        (40.0, 6.92),
    ]
    return params


def fake_frusta() -> List[List[Any]]:
    """A bunch of weird fake well shapes."""
    frusta = []
    frusta.append(
        [
            CuboidalFrustum(
                shape="cuboidal",
                topXDimension=9.0,
                topYDimension=10.0,
                bottomXDimension=8.0,
                bottomYDimension=9.0,
                topHeight=10.0,
                bottomHeight=5.0,
            ),
            CuboidalFrustum(
                shape="cuboidal",
                topXDimension=8.0,
                topYDimension=9.0,
                bottomXDimension=15.0,
                bottomYDimension=18.0,
                topHeight=5.0,
                bottomHeight=2.0,
            ),
            ConicalFrustum(
                shape="conical",
                topDiameter=23.0,
                bottomDiameter=3.0,
                topHeight=2.0,
                bottomHeight=1.0,
            ),
            SphericalSegment(
                shape="spherical",
                radiusOfCurvature=4.0,
                topHeight=1.0,
                bottomHeight=0.0,
            ),
        ]
    )
    frusta.append(
        [
            CuboidalFrustum(
                shape="cuboidal",
                topXDimension=8.0,
                topYDimension=70.0,
                bottomXDimension=7.0,
                bottomYDimension=75.0,
                topHeight=3.5,
                bottomHeight=2.0,
            ),
            CuboidalFrustum(
                shape="cuboidal",
                topXDimension=8.0,
                topYDimension=80.0,
                bottomXDimension=8.0,
                bottomYDimension=90.0,
                topHeight=1.0,
                bottomHeight=0.0,
            ),
        ]
    )
    frusta.append(
        [
            ConicalFrustum(
                shape="conical",
                topDiameter=23.0,
                bottomDiameter=11.5,
                topHeight=7.5,
                bottomHeight=5.0,
            ),
            ConicalFrustum(
                shape="conical",
                topDiameter=11.5,
                bottomDiameter=23.0,
                topHeight=5.0,
                bottomHeight=2.5,
            ),
            ConicalFrustum(
                shape="conical",
                topDiameter=23.0,
                bottomDiameter=11.5,
                topHeight=2.5,
                bottomHeight=0.0,
            ),
        ]
    )
    frusta.append(
        [
            ConicalFrustum(
                shape="conical",
                topDiameter=4.0,
                bottomDiameter=5.0,
                topHeight=3.0,
                bottomHeight=2.0,
            ),
            SphericalSegment(
                shape="spherical",
                radiusOfCurvature=3.5,
                topHeight=2.0,
                bottomHeight=0.0,
            ),
        ]
    )
    frusta.append(
        [
            SphericalSegment(
                shape="spherical",
                radiusOfCurvature=4.0,
                topHeight=3.0,
                bottomHeight=0.0,
            )
        ]
    )
    frusta.append(
        [
            CuboidalFrustum(
                shape="cuboidal",
                topXDimension=27.0,
                topYDimension=36.0,
                bottomXDimension=36.0,
                bottomYDimension=26.0,
                topHeight=3.5,
                bottomHeight=1.5,
            ),
            SphericalSegment(
                shape="spherical",
                radiusOfCurvature=4.0,
                topHeight=1.5,
                bottomHeight=0.0,
            ),
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
            _reject_unacceptable_heights(
                max_height=max_height, potential_heights=potential_heights
            )
    else:
        found_heights = _reject_unacceptable_heights(
            max_height=max_height, potential_heights=potential_heights
        )
        assert found_heights == expected_heights[0]


@pytest.mark.parametrize("diameter", [2, 5, 8, 356, 1000])
def test_cross_section_area_circular(diameter: float) -> None:
    """Test circular area calculation."""
    expected_area = pi * (diameter / 2) ** 2
    assert _cross_section_area_circular(diameter) == expected_area


@pytest.mark.parametrize(
    ["x_dimension", "y_dimension"], [(1, 38402), (234, 983), (94857, 40), (234, 999)]
)
def test_cross_section_area_rectangular(x_dimension: float, y_dimension: float) -> None:
    """Test rectangular area calculation."""
    expected_area = x_dimension * y_dimension
    assert (
        _cross_section_area_rectangular(
            x_dimension=x_dimension, y_dimension=y_dimension
        )
        == expected_area
    )


@pytest.mark.parametrize("well", fake_frusta())
@given(target_height_st=st.data())
def test_volume_and_height_circular(well: List[Any], target_height_st: Any) -> None:
    """Test both volume and height calculations for circular frusta."""
    if well[-1].shape == "spherical":
        return
    if any([seg.shape != "conical" for seg in well]):
        return
    for segment in well:
        if segment.shape == "conical":
            a = segment.topDiameter / 2
            b = segment.bottomDiameter / 2
            # test volume within a bunch of arbitrary heights
            segment_height = segment.topHeight - segment.bottomHeight
            for i in range(50):
                target_height = target_height_st.draw(
                    st.floats(
                        min_value=0,
                        max_value=segment_height,
                        allow_infinity=False,
                        allow_nan=False,
                        width=32,
                    )
                )
                r_y = (target_height / segment_height) * (a - b) + b
                expected_volume = (pi * target_height / 3) * (b**2 + b * r_y + r_y**2)
                found_volume = _volume_from_height_circular(
                    target_height=target_height,
                    segment=segment,
                )
                assert isclose(found_volume, expected_volume)
                # test going backwards to get height back
                found_height = _height_from_volume_circular(
                    target_volume=found_volume, segment=segment
                )
                assert isclose(found_height, target_height, abs_tol=0.001)


@pytest.mark.parametrize("well", fake_frusta())
def test_volume_and_height_rectangular(well: List[Any]) -> None:
    """Test both volume and height calculations for rectangular frusta."""
    if well[-1].shape == "spherical":
        return
    total_height = well[0].topHeight
    for segment in well:
        if segment.shape == "cuboidal":
            top_length = segment.topYDimension
            top_width = segment.topXDimension
            bottom_length = segment.bottomYDimension
            bottom_width = segment.bottomXDimension
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
            assert _rectangular_frustum_polynomial_roots(
                top_length=top_length,
                bottom_length=bottom_length,
                top_width=top_width,
                bottom_width=bottom_width,
                total_frustum_height=total_height,
            ) == (a, b, c)
            # test volume within a bunch of arbitrary heights
            for target_height in range(round(total_height)):
                expected_volume = (
                    a * (target_height**3) + b * (target_height**2) + c * target_height
                )
                found_volume = _volume_from_height_rectangular(
                    target_height=target_height,
                    total_frustum_height=total_height,
                    bottom_length=bottom_length,
                    bottom_width=bottom_width,
                    top_length=top_length,
                    top_width=top_width,
                )
                assert found_volume == expected_volume
                # test going backwards to get height back
                found_height = _height_from_volume_rectangular(
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
    if well[0].shape == "spherical":
        for target_height in range(round(well[0].topHeight)):
            expected_volume = (
                (1 / 3)
                * pi
                * (target_height**2)
                * (3 * well[0].radiusOfCurvature - target_height)
            )
            found_volume = _volume_from_height_spherical(
                target_height=target_height,
                radius_of_curvature=well[0].radiusOfCurvature,
            )
            assert found_volume == expected_volume
            found_height = _height_from_volume_spherical(
                volume=found_volume,
                radius_of_curvature=well[0].radiusOfCurvature,
                total_frustum_height=well[0].topHeight,
            )
            assert isclose(found_height, target_height)


@pytest.mark.parametrize("well", fake_frusta())
def test_height_at_volume_at_section_boundaries(well: List[Any]) -> None:
    """Test that finding the height when volume 0 or ~= capacity  works."""
    inner_well_geometry = InnerWellGeometry(sections=well)
    sorted_well = sorted(
        inner_well_geometry.sections, key=lambda section: section.topHeight
    )
    running_volume = 0.0
    height = find_height_inner_well_geometry(
        target_volume=0.0, well_geometry=inner_well_geometry
    )
    assert isinstance(height, float)
    assert isclose(height, 0.0)
    for segment in sorted_well:
        running_volume += _get_segment_capacity(segment)
        height = find_height_inner_well_geometry(
            target_volume=running_volume,
            well_geometry=inner_well_geometry,
        )
        assert isinstance(height, float)
        assert isclose(height, segment.topHeight)


@pytest.mark.parametrize("well", fake_frusta())
def test_volume_at_section_boundary_heights(well: List[Any]) -> None:
    """Test that finds the volume at the segment boundaries (top/bottom)."""
    inner_well_geometry = InnerWellGeometry(sections=well)
    tot_ul = 0.0
    # reverse b/c list of top->bottom
    for segment in reversed(well):
        bottom_ul = find_volume_inner_well_geometry(
            target_height=segment.bottomHeight, well_geometry=inner_well_geometry
        )
        assert isclose(cast(float, bottom_ul), tot_ul)
        top_ul = find_volume_inner_well_geometry(
            target_height=segment.topHeight, well_geometry=inner_well_geometry
        )
        tot_ul += _get_segment_capacity(segment)
        assert isclose(cast(float, top_ul), tot_ul)


def test_user_volumes_raises_error_for_invalid_target(
    user_defined_volumes_params: Dict[str, Any],
) -> None:
    """Test that UserDefinedVolumes calculations reject target inputs that are not allowed."""
    user_defined_volumes_obj = user_defined_volumes_params["obj"]
    max_defined_height = user_defined_volumes_obj.heightToVolumeMap[-1].height
    max_defined_volume = user_defined_volumes_obj.heightToVolumeMap[-1].volume
    min_defined_height = user_defined_volumes_obj.heightToVolumeMap[0].height
    min_defined_volume = user_defined_volumes_obj.heightToVolumeMap[0].volume

    # less than 0 should raise an error
    with pytest.raises(InvalidLiquidHeightFound):
        find_volume_user_defined_volumes(
            target_height=-0.01, well_geometry=user_defined_volumes_obj
        )
    with pytest.raises(InvalidLiquidHeightFound):
        find_height_user_defined_volumes(
            target_volume=-0.01, well_geometry=user_defined_volumes_obj
        )

    # between 0 and min defined height should be ok
    vol = find_volume_user_defined_volumes(
        target_height=(min_defined_height / 2), well_geometry=user_defined_volumes_obj
    )
    assert vol is not None
    height = find_height_user_defined_volumes(
        target_volume=(min_defined_volume / 2), well_geometry=user_defined_volumes_obj
    )
    assert height is not None

    # betwen min defined height and max defined height should be ok
    vol = find_volume_user_defined_volumes(
        target_height=((min_defined_height + max_defined_height) / 2),
        well_geometry=user_defined_volumes_obj,
    )
    assert vol is not None
    height = find_height_user_defined_volumes(
        target_volume=((min_defined_volume + max_defined_volume) / 2),
        well_geometry=user_defined_volumes_obj,
    )
    assert height is not None

    # any greater than max defined height should cause an error
    with pytest.raises(InvalidLiquidHeightFound):
        find_volume_user_defined_volumes(
            target_height=max_defined_height + 0.01,
            well_geometry=user_defined_volumes_obj,
        )
    with pytest.raises(InvalidLiquidHeightFound):
        find_height_user_defined_volumes(
            target_volume=max_defined_volume + 0.01,
            well_geometry=user_defined_volumes_obj,
        )


def test_get_user_volumes(user_defined_volumes_params: Dict[str, Any]) -> None:
    """Test linear interpolation math for user-defined volumes."""
    user_defined_volumes_obj = user_defined_volumes_params["obj"]
    inputs_expected_outputs = user_defined_volumes_params[
        "volume_inputs_expected_outputs"
    ]
    for height, expected_vol in inputs_expected_outputs:
        volume_estimate = find_volume_user_defined_volumes(
            target_height=height, well_geometry=user_defined_volumes_obj
        )
        assert isinstance(volume_estimate, float)
        assert isclose(volume_estimate, expected_vol, abs_tol=0.001)


def test_get_user_heights(
    user_defined_volumes_params: Dict[str, Any],
) -> None:
    """Test linear interpolation math for user-defined volumes."""
    user_defined_volumes_obj = user_defined_volumes_params["obj"]
    inputs_expected_outputs = user_defined_volumes_params[
        "height_inputs_expected_outputs"
    ]

    for vol, expected_height in inputs_expected_outputs:
        height_estimate = find_height_user_defined_volumes(
            target_volume=vol, well_geometry=user_defined_volumes_obj
        )
        assert isinstance(height_estimate, float)
        assert isclose(height_estimate, expected_height, abs_tol=0.001)
