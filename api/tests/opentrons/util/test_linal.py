from math import pi, sin, cos
from opentrons.util.linal import solve, add_z, apply_transform, solve_attitude
from numpy.linalg import inv
import numpy as np


def test_solve() -> None:
    theta = pi / 3.0  # 60 deg
    scale = 2.0

    expected = [
        (cos(0), sin(0)),
        (cos(pi / 2), sin(pi / 2)),
        (cos(pi), sin(pi)),
    ]

    actual = [
        (cos(theta) * scale + 0.5, sin(theta) * scale + 0.25),
        (cos(theta + pi / 2) * scale + 0.5, sin(theta + pi / 2) * scale + 0.25),
        (cos(theta + pi) * scale + 0.5, sin(theta + pi) * scale + 0.25),
    ]

    X = solve(expected, actual)

    expected2 = np.array(
        [cos(theta + pi / 2) * scale + 0.5, sin(theta + pi / 2) * scale + 0.25, 1]
    )
    result = np.dot(X, np.array([[0], [1], [1]])).transpose()

    assert np.isclose(expected2, result).all()


def test_add_z() -> None:
    x = 5
    y = 10
    z = 20

    xy_array = np.array([[1, 0, x], [0, 1, y], [0, 0, 1]])

    expected = np.array([[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]])

    result = add_z(xy_array, z)
    assert (result == expected).all()


def test_apply_transform() -> None:
    x = 1
    y = 2
    z = 3

    x_delta = 0.1
    y_delta = 0.2

    e = ((1, 1, 3), (2, 2, 2), (1, 2, 1))
    a = (
        (1 + x_delta, 1 + y_delta, 1.1),
        (2 + x_delta, 2 + y_delta, 2.2),
        (1 + x_delta, 2 + y_delta, 1.1),
    )
    transform = solve_attitude(e, a)

    expected = (round(x - x_delta, 2), round(y - y_delta, 2), round(z))

    result = apply_transform(inv(transform), (1, 2, 3))
    assert np.isclose(result, expected, atol=0.1).all()
