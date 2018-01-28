from math import pi, sin, cos
from opentrons.cli.linal import solve
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
