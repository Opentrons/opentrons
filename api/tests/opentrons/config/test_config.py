from opentrons.config import merge, children, build


def test_merge():
    dict1 = {
        'a': {
            'b': 1,
        },
        'c': 2
    }

    dict2 = {
        'a': {
            'b': 10,
            'c': 20
        },
        'd': 30
    }

    assert merge([dict1, dict2]) == {
        'a': {
            'b': 10,
            'c': 20
        },
        'c': 2,
        'd': 30
    }


def test_children():
    tree = {
        'a': {
            'b': 1,
            'c': {
                'e': 2
            },
            'f': 3
        },
        'g': {
            'h': 1,
            'i': None
        }
    }

    expected = [
        (('a', 'b'), 1),
        (('a', 'c', 'e'), 2),
        (('a', 'f'), 3),
        (('g', 'h'), 1),
        (('g', 'i'), None),
    ]
    result = children(tree)

    assert len(expected) == len(result)
    assert set(children(tree)) == set(expected)

    assert tree == build(expected)
    assert build(expected + [(('g', 'h'), 10), (('a', 'c', 'e'), 20)]) == {
        'a': {
            'b': 1,
            'c': {
                'e': 20
            },
            'f': 3
        },
        'g': {
            'h': 10,
            'i': None
        }
    }
