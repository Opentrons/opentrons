from typing import List, Optional, Tuple, NewType, overload
from numpy import pi, iscomplex, roots, real

CircularType = NewType("circular", str)
SphericalType = NewType("rectangular", str)
RectangularType = NewType("spherical", str)


def reject_unacceptable_heights(
    potential_heights: List[float], max_height: float
) -> float:
    if len(potential_heights) > 1:
        for root in potential_heights:
            # reject any heights that are negative or greater than the max height
            if root > max_height:
                potential_heights.remove(root)
            elif root < 0:
                potential_heights.remove(root)
    assert len(potential_heights) == 1
    return potential_heights[0]


def rectangular_frustum_polynomial_roots(
    bottom_length: float,
    bottom_width: float,
    top_length: float,
    top_width: float,
    total_frustum_height: float,
) -> Tuple[float, float, float]:
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
    a = pi * ((top_radius - bottom_radius) ** 2) / (3 * total_frustum_height**2)
    b = pi * bottom_radius * (top_radius - bottom_radius) / total_frustum_height
    c = pi * bottom_radius**2
    return a, b, c


@overload
def volume_from_height(
    shape: CircularType,
    target_height: float,
    total_frustum_height: float,
    bottom_radius: float,
    top_radius: float,
) -> float:
    ...


@overload
def volume_from_height(
    shape: RectangularType,
    target_height: float,
    total_frustum_height: float,
    bottom_length: float,
    bottom_width: float,
    top_length: float,
    top_width: float,
) -> float:
    ...


@overload
def volume_from_height(
    shape: SphericalType, target_height: float, radius_of_curvature: float
) -> float:
    volume = (
        (1 / 3) * pi * (target_height**2) * (3 * radius_of_curvature - target_height)
    )
    return volume


def volume_from_height(
    shape: str,
    target_height: float,
    total_frustum_height: Optional[float] = None,
    bottom_radius: Optional[float] = None,
    top_radius: Optional[float] = None,
    bottom_length: Optional[float] = None,
    bottom_width: Optional[float] = None,
    top_length: Optional[float] = None,
    top_width: Optional[float] = None,
    radius_of_curvature: Optional[float] = None,
) -> float:
    volume_polynomial_form = []
    if shape == "rectangular":
        assert bottom_length and bottom_width and top_length and top_width
        volume_polynomial_form = rectangular_frustum_polynomial_roots(
            bottom_length=bottom_length,
            bottom_width=bottom_width,
            top_length=top_length,
            top_width=top_width,
            total_frustum_height=total_frustum_height,
        )
    elif shape == "circular":
        assert top_radius and bottom_radius
        volume_polynomial_form = circular_frustum_polynomial_roots(
            bottom_radius=bottom_radius,
            top_radius=top_radius,
            total_frustum_height=total_frustum_height,
        )
    a, b, c = volume_polynomial_form
    volume = a * (target_height**3) + b * (target_height**2) + c * target_height
    return volume


@overload
def height_from_volume(
    shape: CircularType,
    volume: float,
    total_frustum_height: float,
    bottom_radius: float,
    top_radius: float,
) -> float:
    ...


@overload
def height_from_volume(
    shape: RectangularType,
    volume: float,
    total_frustum_height: float,
    bottom_length: float,
    bottom_width: float,
    top_length: float,
    top_width: float,
) -> float:
    ...


@overload
def height_from_volume(
    shape: SphericalType, volume: float, radius_of_curvature: float
) -> float:
    ...


def height_from_volume(
    shape: str,
    volume: float,
    total_frustum_height: float,
    bottom_radius: Optional[float] = None,
    top_radius: Optional[float] = None,
    bottom_length: Optional[float] = None,
    bottom_width: Optional[float] = None,
    top_length: Optional[float] = None,
    top_width: Optional[float] = None,
    radius_of_curvature: Optional[float] = None,
) -> float:
    volume_polynomial_form = []
    if shape == "spherical":
        assert radius_of_curvature
        a = -1 * pi / 3
        b = pi * radius_of_curvature
        c = 0
        volume_polynomial_form = [a, b, c]
    elif shape == "rectangular":
        assert bottom_length and bottom_width and top_length and top_width
        volume_polynomial_form = rectangular_frustum_polynomial_roots(
            bottom_length=bottom_length,
            bottom_width=bottom_width,
            top_length=top_length,
            top_width=top_width,
            total_frustum_height=total_frustum_height,
        )
    elif shape == "circular":
        assert top_radius and bottom_radius
        volume_polynomial_form = circular_frustum_polynomial_roots(
            bottom_radius=bottom_radius,
            top_radius=top_radius,
            total_frustum_height=total_frustum_height,
        )
    d = volume * -1
    # now we have a polynomial in the form:
    # 0 = ax^3 + bx^2 + cx + d
    volume_polynomial_form.append(d)

    height_from_volume_roots = roots(volume_polynomial_form)
    real_roots = []
    for r in height_from_volume_roots:
        if not iscomplex(r):
            real_roots.append(r)
    height = reject_unacceptable_heights(
        potential_heights=real_roots,
        max_height=total_frustum_height,
    )
    return real(height)
