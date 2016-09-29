def sum_tuples(*args):
    """
    Sums all tuple arguments element-wise.

    E.g.: sum_tuples((1,1,1), (2,2,2), (3,3,3)) -> (6, 6, 6)
    :param args:
    :return:
    """
    return tuple(map(sum, zip(*args)))
