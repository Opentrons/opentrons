import numpy as np
from numpy.linalg import inv
from math import pi, sin, cos


def solve(expected, actual):
    A = np.array([
            list(point) + [1]
            for point in expected
        ]).transpose()

    B = np.array([
            list(point) + [1]
            for point in actual
        ]).transpose()

    return np.dot(B, inv(A))


def test():
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


def calc():
    expected = [
        (64,    354.70),  # 1
        (329,   354.70),  # 3
        (196.50, 83.70),  # 11
    ]

    actual = [
        (33.0, 5.0),
        (298.0, 6.0),
        (169.0, 276.0),
    ]
    return solve(expected, actual)


if __name__ == '__main__':
    print('TEST: ' + repr(calc()))
