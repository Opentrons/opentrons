import json

from opentrons.server import serialize
from opentrons import robot, instruments, containers

class A:
    def __init__(self, args):
        self.update(args)

    def update(self, args):
        for k, v in args.items():
            setattr(self, k, v)


def test_robot():
    pass


def test_extract_references():
    a1 = A(
                {
                    'b': 1,
                    'c': 'c',
                    'd': True,
                    'e': None
                })
    a2 = A({'a': 1})
    a3 = A({})

    root = A(
        {
            'a': a1,
            'b': [a2, 'b', 1],
            'c': {'a': 1, 'b': [1, 2, a3]},
        }
    )
    root.update({'circular': root})

    tree, refs = serialize.get_object_tree(root)

    assert refs == { id(o) : o for o in [root, a1, a2, a3] }
    assert tree == {
        '$meta': {'that': id(root)},
        'A': {
            'a': {
                '$meta': {'that': id(a1)},
                'A': {
                    'b': {'int': 1},
                    'c': {'str': 'c'},
                    'd': {'bool': True},
                    'e': {'NoneType': None}}},
            'b': {
                'list': [
                    {
                        '$meta': {'that': id(a2)},
                        'A': {
                            'a': {'int': 1}
                        }
                    },
                    {'str': 'b'},
                    {'int': 1}
                ]},
            'c': {
                'dict': {
                    'a': {'int': 1},
                    'b': {
                        'list': [
                            {'int': 1},
                            {'int': 2},
                            {'$meta': {'that': id(a3)},
                            'A': {}}]}}},
            'circular': None}}
    assert json.dumps(tree)
