import pytest

from opentrons.util import helpers


@pytest.fixture
def deep_dict():
    return {
        'a': 1,
        'b': [1, 2, 3],
        'c': {
            'a': [4, 5, 6],
            'b': {
                'd': 4
            },
        },
        'd': [
            {'a': [7, 8, 9]}
        ]
    }


@pytest.mark.parametrize(argnames="key,expected_result",
                         argvalues=[
                             # Success cases
                             ['a', 1],
                             ['b.2', 3],
                             ['c.a.1', 5],
                             ['c.b.d', 4],
                             ['d.0.a.2', 9],
                             [['a'], 1],
                             [['b', '2'], 3],
                             [['c', 'a', 1], 5],
                             [['c', 'b', 'd'], 4],
                             [['d', '0', 'a', 2], 9],
                             # Failure cases
                             [None, None],
                             [[], None],
                             # look out that float isn't interpreted as index
                             [['b', 1.3], None],
                         ])
def test_deep_get(deep_dict, key, expected_result):
    assert helpers.deep_get(deep_dict, key) == expected_result
