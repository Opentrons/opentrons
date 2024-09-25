"""Helper functions for liquid-level related calculations inside a given frustum."""
from typing import List, Tuple, Iterator, Sequence, Any, Union, Optional
from numpy import pi, iscomplex, roots, real
from math import sqrt, isclose

from ..errors.exceptions import InvalidLiquidHeightFound, InvalidWellDefinitionError
from opentrons_shared_data.labware.types import (
    is_circular_frusta_list,
    is_rectangular_frusta_list,
    CircularBoundedSection,
    RectangularBoundedSection,
)
from opentrons_shared_data.labware.labware_definition import InnerWellGeometry


def reject_unacceptable_heights(
    potential_heights: List[float], max_height: float
) -> float:
    """Reject any solutions to a polynomial equation that cannot be the height of a frustum."""
    valid_heights: List[float] = []
    for root in potential_heights:
        # reject any heights that are negative or greater than the max height
        if not iscomplex(root):
            # take only the real component of the root and round to 4 decimal places
            rounded_root = round(real(root), 4)
            if (rounded_root <= max_height) and (rounded_root >= 0):
                if not any([isclose(rounded_root, height) for height in valid_heights]):
                    valid_heights.append(rounded_root)
    if len(valid_heights) != 1:
        raise InvalidLiquidHeightFound(
            message="Unable to estimate valid liquid height from volume."
        )
    return valid_heights[0]


def get_cross_section_area(
    bounded_section: Union[CircularBoundedSection, RectangularBoundedSection]
) -> float:
    """Find the shape of a cross-section and calculate the area appropriately."""
    if bounded_section["shape"] == "circular":
        cross_section_area = cross_section_area_circular(bounded_section["diameter"])
    elif bounded_section["shape"] == "rectangular":
        cross_section_area = cross_section_area_rectangular(
            bounded_section["xDimension"],
            bounded_section["yDimension"],
        )
    else:
        raise InvalidWellDefinitionError(message="Invalid well volume components.")
    return cross_section_area


def cross_section_area_circular(diameter: float) -> float:
    """Get the area of a circular cross-section."""
    radius = diameter / 2
    return pi * (radius**2)


def cross_section_area_rectangular(x_dimension: float, y_dimension: float) -> float:
    """Get the area of a rectangular cross-section."""
    return x_dimension * y_dimension


def volume_from_frustum_formula(area_1: float, area_2: float, height: float) -> float:
    """Get the area of a section with differently shaped boundary cross-sections."""
    area_term = area_1 + area_2 + sqrt(area_1 * area_2)
    return (height / 3) * area_term


def height_from_frustum_formula(area_1: float, area_2: float, volume: float) -> float:
    """Get the volume within a section with differently shaped boundary cross-sections."""
    area_term = area_1 + area_2 + sqrt(area_1 * area_2)
    return 3 * volume / area_term


def rectangular_frustum_polynomial_roots(
    bottom_length: float,
    bottom_width: float,
    top_length: float,
    top_width: float,
    total_frustum_height: float,
) -> Tuple[float, float, float]:
    """Polynomial representation of the volume of a rectangular frustum."""
    # roots of the polynomial with shape ax^3 + bx^2 + cx
    a = (
        (top_length - bottom_length)
        * (top_width - bottom_width)
        / (3 * total_frustum_height**2)
    )
    b = (
        (bottom_length * (top_width - bottom_width))
        + (bottom_width * (top_length - bottom_length))
    ) / (2 * total_frustum_height)
    c = bottom_length * bottom_width
    return a, b, c


def circular_frustum_polynomial_roots(
    bottom_radius: float,
    top_radius: float,
    total_frustum_height: float,
) -> Tuple[float, float, float]:
    """Polynomial representation of the volume of a circular frustum."""
    # roots of the polynomial with shape ax^3 + bx^2 + cx
    a = pi * ((top_radius - bottom_radius) ** 2) / (3 * total_frustum_height**2)
    b = pi * bottom_radius * (top_radius - bottom_radius) / total_frustum_height
    c = pi * bottom_radius**2
    return a, b, c


def volume_from_height_circular(
    target_height: float,
    total_frustum_height: float,
    bottom_radius: float,
    top_radius: float,
) -> float:
    """Find the volume given a height within a circular frustum."""
    a, b, c = circular_frustum_polynomial_roots(
        bottom_radius=bottom_radius,
        top_radius=top_radius,
        total_frustum_height=total_frustum_height,
    )
    volume = a * (target_height**3) + b * (target_height**2) + c * target_height
    return volume


def volume_from_height_rectangular(
    target_height: float,
    total_frustum_height: float,
    bottom_length: float,
    bottom_width: float,
    top_length: float,
    top_width: float,
) -> float:
    """Find the volume given a height within a rectangular frustum."""
    a, b, c = rectangular_frustum_polynomial_roots(
        bottom_length=bottom_length,
        bottom_width=bottom_width,
        top_length=top_length,
        top_width=top_width,
        total_frustum_height=total_frustum_height,
    )
    volume = a * (target_height**3) + b * (target_height**2) + c * target_height
    return volume


def volume_from_height_spherical(
    target_height: float,
    radius_of_curvature: float,
) -> float:
    """Find the volume given a height within a spherical frustum."""
    volume = (
        (1 / 3) * pi * (target_height**2) * (3 * radius_of_curvature - target_height)
    )
    return volume


def height_from_volume_circular(
    volume: float,
    total_frustum_height: float,
    bottom_radius: float,
    top_radius: float,
) -> float:
    """Find the height given a volume within a circular frustum."""
    a, b, c = circular_frustum_polynomial_roots(
        bottom_radius=bottom_radius,
        top_radius=top_radius,
        total_frustum_height=total_frustum_height,
    )
    d = volume * -1
    x_intercept_roots = (a, b, c, d)

    height_from_volume_roots = roots(x_intercept_roots)
    height = reject_unacceptable_heights(
        potential_heights=list(height_from_volume_roots),
        max_height=total_frustum_height,
    )
    return height


def height_from_volume_rectangular(
    volume: float,
    total_frustum_height: float,
    bottom_length: float,
    bottom_width: float,
    top_length: float,
    top_width: float,
) -> float:
    """Find the height given a volume within a rectangular frustum."""
    a, b, c = rectangular_frustum_polynomial_roots(
        bottom_length=bottom_length,
        bottom_width=bottom_width,
        top_length=top_length,
        top_width=top_width,
        total_frustum_height=total_frustum_height,
    )
    d = volume * -1
    x_intercept_roots = (a, b, c, d)

    height_from_volume_roots = roots(x_intercept_roots)
    height = reject_unacceptable_heights(
        potential_heights=list(height_from_volume_roots),
        max_height=total_frustum_height,
    )
    return height


def height_from_volume_spherical(
    volume: float,
    radius_of_curvature: float,
    total_frustum_height: float,
) -> float:
    """Find the height given a volume within a spherical frustum."""
    a = -1 * pi / 3
    b = pi * radius_of_curvature
    c = 0.0
    d = volume * -1
    x_intercept_roots = (a, b, c, d)

    height_from_volume_roots = roots(x_intercept_roots)
    height = reject_unacceptable_heights(
        potential_heights=list(height_from_volume_roots),
        max_height=total_frustum_height,
    )
    return height


def get_boundary_pairs(frusta: Sequence[Any]) -> Iterator[Tuple[Any, Any]]:
    """Yield tuples representing two cross-section boundaries of a segment of a well."""
    iter_f = iter(frusta)
    el = next(iter_f)
    for next_el in iter_f:
        yield el, next_el
        el = next_el


def get_well_volumetric_capacity(
    well_geometry: InnerWellGeometry,
) -> List[Tuple[float, float]]:
    """Return the total volumetric capacity of a well as a map of height borders to volume."""
    # dictionary map of heights to volumetric capacities within their respective segment
    # {top_height_0: volume_0, top_height_1: volume_1, top_height_2: volume_2}
    well_volume = []
    if well_geometry.bottomShape is not None:
        if well_geometry.bottomShape.shape == "spherical":
            bottom_spherical_section_depth = well_geometry.bottomShape.depth
            bottom_sphere_volume = volume_from_height_spherical(
                radius_of_curvature=well_geometry.bottomShape.radiusOfCurvature,
                target_height=bottom_spherical_section_depth,
            )
            well_volume.append((bottom_spherical_section_depth, bottom_sphere_volume))

    # get the volume of remaining frusta sorted in ascending order
    sorted_frusta = sorted(well_geometry.frusta, key=lambda section: section.topHeight)

    if is_rectangular_frusta_list(sorted_frusta):
        for f, next_f in get_boundary_pairs(sorted_frusta):
            top_cross_section_width = next_f["xDimension"]
            top_cross_section_length = next_f["yDimension"]
            bottom_cross_section_width = f["xDimension"]
            bottom_cross_section_length = f["yDimension"]
            frustum_height = next_f["topHeight"] - f["topHeight"]
            frustum_volume = volume_from_height_rectangular(
                target_height=frustum_height,
                total_frustum_height=frustum_height,
                bottom_length=bottom_cross_section_length,
                bottom_width=bottom_cross_section_width,
                top_length=top_cross_section_length,
                top_width=top_cross_section_width,
            )

            well_volume.append((next_f["topHeight"], frustum_volume))
    elif is_circular_frusta_list(sorted_frusta):
        for f, next_f in get_boundary_pairs(sorted_frusta):
            top_cross_section_radius = next_f["diameter"] / 2.0
            bottom_cross_section_radius = f["diameter"] / 2.0
            frustum_height = next_f["topHeight"] - f["topHeight"]
            frustum_volume = volume_from_height_circular(
                target_height=frustum_height,
                total_frustum_height=frustum_height,
                bottom_radius=bottom_cross_section_radius,
                top_radius=top_cross_section_radius,
            )

            well_volume.append((next_f["topHeight"], frustum_volume))
    else:
        for f, next_f in get_boundary_pairs(sorted_frusta):
            bottom_cross_section_area = get_cross_section_area(f)
            top_cross_section_area = get_cross_section_area(next_f)
            section_height = next_f["topHeight"] - f["topHeight"]
            bounded_volume = volume_from_frustum_formula(
                bottom_cross_section_area, top_cross_section_area, section_height
            )
            well_volume.append((next_f["topHeight"], bounded_volume))
    return well_volume


def height_at_volume_within_section(
    top_cross_section: Union[CircularBoundedSection, RectangularBoundedSection],
    bottom_cross_section: Union[CircularBoundedSection, RectangularBoundedSection],
    target_volume_relative: float,
    frustum_height: float,
) -> float:
    """Calculate a height within a bounded section according to geometry."""
    if top_cross_section["shape"] == bottom_cross_section["shape"] == "circular":
        frustum_height = height_from_volume_circular(
            volume=target_volume_relative,
            top_radius=(top_cross_section["diameter"] / 2),
            bottom_radius=(bottom_cross_section["diameter"] / 2),
            total_frustum_height=frustum_height,
        )
    elif top_cross_section["shape"] == bottom_cross_section["shape"] == "rectangular":
        frustum_height = height_from_volume_rectangular(
            volume=target_volume_relative,
            total_frustum_height=frustum_height,
            bottom_width=bottom_cross_section["xDimension"],
            bottom_length=bottom_cross_section["yDimension"],
            top_width=top_cross_section["xDimension"],
            top_length=top_cross_section["yDimension"],
        )
    return frustum_height


def volume_at_height_within_section(
    top_cross_section: Union[CircularBoundedSection, RectangularBoundedSection],
    bottom_cross_section: Union[CircularBoundedSection, RectangularBoundedSection],
    target_height_relative: float,
    frustum_height: float,
) -> float:
    """Calculate a volume within a bounded section according to geometry."""
    if top_cross_section["shape"] == bottom_cross_section["shape"] == "circular":
        frustum_volume = volume_from_height_circular(
            target_height=target_height_relative,
            total_frustum_height=frustum_height,
            bottom_radius=(bottom_cross_section["diameter"] / 2),
            top_radius=(top_cross_section["diameter"] / 2),
        )
    elif top_cross_section["shape"] == bottom_cross_section["shape"] == "rectangular":
        frustum_volume = volume_from_height_rectangular(
            target_height=target_height_relative,
            total_frustum_height=frustum_height,
            bottom_width=bottom_cross_section["xDimension"],
            bottom_length=bottom_cross_section["yDimension"],
            top_width=top_cross_section["xDimension"],
            top_length=top_cross_section["yDimension"],
        )
    # else:
    # TODO(cm): this would be the NEST-96 2uL wells referenced in EXEC-712
    # we need to input the math attached to that issue
    return frustum_volume


def _find_volume_in_partial_frustum(
    sorted_frusta: List[Any],
    target_height: float,
) -> Optional[float]:
    """Look through a sorted list of frusta for a target height, and find the volume at that height."""
    partial_volume: Optional[float] = None
    for bottom_cross_section, top_cross_section in get_boundary_pairs(sorted_frusta):
        if (
            bottom_cross_section["topHeight"]
            < target_height
            < top_cross_section["targetHeight"]
        ):
            relative_target_height = target_height - bottom_cross_section["topHeight"]
            frustum_height = (
                top_cross_section["topHeight"] - bottom_cross_section["topHeight"]
            )
            partial_volume = volume_at_height_within_section(
                top_cross_section=top_cross_section,
                bottom_cross_section=bottom_cross_section,
                target_height_relative=relative_target_height,
                frustum_height=frustum_height,
            )
    return partial_volume


def find_volume_at_well_height(
    target_height: float, well_geometry: InnerWellGeometry
) -> float:
    """Find the volume within a well, at a known height."""
    volumetric_capacity = get_well_volumetric_capacity(well_geometry)
    max_height = volumetric_capacity[-1][0]
    if target_height < 0 or target_height > max_height:
        raise InvalidLiquidHeightFound("Invalid target height.")

    closed_section_volume = 0.0
    for boundary_height, section_volume in volumetric_capacity:
        if boundary_height > target_height:
            break
        closed_section_volume += section_volume
        # if target height is a boundary cross-section, we already know the volume
        if target_height == boundary_height:
            return closed_section_volume
    # find the section the target height is in and compute the volume
    # since bottomShape is not in list of frusta, check here first
    if well_geometry.bottomShape:
        bottom_segment_height = volumetric_capacity[0][0]
        if (
            target_height < bottom_segment_height
            and well_geometry.bottomShape.shape == "spherical"
        ):
            return volume_from_height_spherical(
                target_height=target_height,
                radius_of_curvature=well_geometry.bottomShape.radiusOfCurvature,
            )
    sorted_frusta = sorted(well_geometry.frusta, key=lambda section: section.topHeight)
    partial_volume = _find_volume_in_partial_frustum(
        sorted_frusta=sorted_frusta,
        target_height=target_height,
    )
    if not partial_volume:
        raise InvalidLiquidHeightFound("Unable to find volume at given well-height.")
    return partial_volume + closed_section_volume


def _find_height_in_partial_frustum(
    sorted_frusta: List[Any],
    volumetric_capacity: List[Tuple[float, float]],
    target_volume: float,
) -> Optional[float]:
    """Look through a sorted list of frusta for a target volume, and find the height at that volume."""
    partial_height: Optional[float] = None
    for cross_sections, capacity in zip(
        get_boundary_pairs(sorted_frusta),
        get_boundary_pairs(volumetric_capacity),
    ):
        bottom_cross_section, top_cross_section = cross_sections
        (bottom_height, bottom_volume), (top_height, top_volume) = capacity

        if bottom_volume < target_volume < top_volume:
            relative_target_volume = target_volume - bottom_volume
            frustum_height = top_height - bottom_height
            partial_height = height_at_volume_within_section(
                top_cross_section=top_cross_section,
                bottom_cross_section=bottom_cross_section,
                target_volume_relative=relative_target_volume,
                frustum_height=frustum_height,
            )
    return partial_height


def find_height_at_well_volume(
    target_volume: float, well_geometry: InnerWellGeometry
) -> float:
    """Find the height within a well, at a known volume."""
    volumetric_capacity = get_well_volumetric_capacity(well_geometry)
    max_volume = volumetric_capacity[-1][1]
    if target_volume < 0 or target_volume > max_volume:
        raise InvalidLiquidHeightFound("Invalid target height.")

    closed_section_height = 0.0
    for boundary_height, section_volume in volumetric_capacity:
        if section_volume > target_volume:
            break
        closed_section_height = boundary_height
        # if target height is a boundary cross-section, we already know the volume
        if target_volume == section_volume:
            return boundary_height
    sorted_frusta = sorted(well_geometry.frusta, key=lambda section: section.topHeight)
    # find the section the target volume is in and compute the height
    # since bottomShape is not in list of frusta, check here first
    if well_geometry.bottomShape:
        volume_within_bottom_segment = volumetric_capacity[0][1]
        if (
            target_volume < volume_within_bottom_segment
            and well_geometry.bottomShape.shape == "spherical"
        ):
            return height_from_volume_spherical(
                volume=target_volume,
                radius_of_curvature=well_geometry.bottomShape.radiusOfCurvature,
                total_frustum_height=well_geometry.bottomShape.depth,
            )
        # we need to look through the volumetric capacity list without the bottom shape
        volumetric_capacity.pop(0)
    partial_height = _find_height_in_partial_frustum(
        sorted_frusta=sorted_frusta,
        volumetric_capacity=volumetric_capacity,
        target_volume=target_volume,
    )
    if not partial_height:
        raise InvalidLiquidHeightFound("Unable to find height at given well-volume.")
    return partial_height + closed_section_height
