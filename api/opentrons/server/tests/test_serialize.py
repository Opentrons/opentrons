import json
import pytest

from opentrons.server import serialize
from opentrons import robot, instruments, containers

@pytest.fixture
def instance():
    class A:
        def __init__(self, args):
            self.update(args)

        def update(self, args):
            for k, v in args.items():
                setattr(self, k, v)

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

    return (root, a1, a2, a3)

def test_robot():
    trough = containers.load('trough-12row', 'C1', 'trough')
    plate = containers.load('96-PCR-flat', 'D1', 'plate')

    # a tip rack for our pipette
    p200rack = containers.load('tiprack-200ul', 'B1', 'tiprack')

    # create a p200 pipette on robot axis B
    p200 = instruments.Pipette(
        name="p200",
        axis="b",
        min_volume=20,
        max_volume=200,
        tip_racks=[p200rack]
    )

    # Robot tree is pretty big and hard to verify
    # Making sure we can serialize it into json
    tree, refs = serialize.get_object_tree(robot)
    json.dumps(tree)    


def test_get_object_tree(instance):
    root, a1, a2, a3 = instance

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


def test_get_object_tree_shallow(instance):
    root, *_ = instance
    tree, refs = serialize.get_object_tree(root, shallow=True)

    assert tree == {'$meta': {'that': id(root)}, 'A': {}}
    assert refs == {id(root): root}
