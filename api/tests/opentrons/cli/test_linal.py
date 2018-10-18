from math import pi, sin, cos
from opentrons.util.linal import solve, add_z, apply_transform
from numpy.linalg import inv
import numpy as np


def test_solve():
    theta = pi / 3.0  # 60 deg
    scale = 2.0

    expected = [
        [cos(0)           , sin(0)],          # NOQA
        [cos(pi / 2)      , sin(pi / 2)],     # NOQA
        [cos(pi)          , sin(pi)]]         # NOQA

    actual = [
        [cos(theta) * scale + 0.5          , sin(theta) * scale + 0.25],            # NOQA
        [cos(theta + pi / 2) * scale + 0.5 , sin(theta + pi / 2) * scale + 0.25],   # NOQA
        [cos(theta + pi) * scale + 0.5     , sin(theta + pi) * scale + 0.25]]       # NOQA

    X = solve(expected, actual)

    expected = np.array([cos(theta + pi / 2) * scale + 0.5 , sin(theta + pi / 2) * scale + 0.25, 1])   # NOQA
    result = np.dot(X, np.array([[0], [1], [1]])).transpose()

    return np.isclose(expected, result).all()


def test_add_z():
    x = 5
    y = 10
    z = 20

    xy_array = np.array([
        [1, 0, x],
        [0, 1, y],
        [0, 0, 1]])

    expected = np.array([
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1]])

    result = add_z(xy_array, z)
    assert (result == expected).all()


def test_apply_transform():
    x = 1
    y = 2
    z = 3

    x_delta = -0.1
    y_delta = -0.2
    z_delta = 0.3

    transform = [
        [1, 0, 0, x_delta],
        [0, 1, 0, y_delta],
        [0, 0, 1, z_delta],
        [0, 0, 0, 1]]

    expected = (
        round(x - x_delta, 2),
        round(y - y_delta, 2),
        round(z - z_delta, 2))

    result = apply_transform(inv(transform), (x, y, z))
    assert result == expected
