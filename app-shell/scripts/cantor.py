import math


def cantor_calculate(x, y):
    """
    Returns cantor value of 'x' & 'y'
    https://en.wikipedia.org/wiki/Pairing_function
    """
    return int((((x + y)*(x + y + 1))/2) + y)


def cantor_reverse(z):
    """
    Returns cantor pair that resulted in 'z'
    https://en.wikipedia.org/wiki/Pairing_function
    """
    w = math.floor((math.sqrt((8*z) + 1) - 1) / 2)
    t = ((w**2) + w)/2
    y = z - t
    x = w - y
    return (int(x), int(y))
