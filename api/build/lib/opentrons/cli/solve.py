import numpy as np
from numpy.linalg import inv


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
