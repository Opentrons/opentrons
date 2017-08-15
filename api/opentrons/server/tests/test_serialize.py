import json
import pytest

from collections import OrderedDict
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

        def __iter__(self):
            return iter([0])

    a1 = A({'b': 1, 'c': 'c', 'd': True, 'e': None})
    a2 = A({'a': 1})
    a3 = A({})

    root = A({
                'a': a1,
                'b': [a2, 'b', 1],
                'c': {'a': 1, 'b': [1, 2, a3]},
            })
    root.update({'circular': root})

    return (root, a1, a2, a3)


def type_id(instance):
    return id(type(instance))


def test_robot():
    containers.load('trough-12row', 'C1', 'trough')
    containers.load('96-PCR-flat', 'D1', 'plate')

    # a tip rack for our pipette
    p200rack = containers.load('tiprack-200ul', 'B1', 'tiprack')

    # create a p200 pipette on robot axis B
    instruments.Pipette(
        name="p200",
        axis="b",
        min_volume=20,
        max_volume=200,
        tip_racks=[p200rack]
    )

    # Robot tree is pretty big and hard to verify
    # Making sure we can serialize it into json
    tree, refs = serialize.get_object_tree(robot)


def test_get_object_tree(instance):
    root, a1, a2, a3 = instance
    tree, refs = serialize.get_object_tree(root)

    r = [root, a1, a2, a3]
    r += [type(o) for o in r] + [dict]
    assert refs == {id(o): o for o in r}
    assert tree == {
        'i': id(root),
        't': type_id(root),
        'v': {
            '0': 0,
            'a': {
                'i': id(a1),
                't': type_id(a1),
                'v': {
                    '0': 0,
                    'b': 1,
                    'c': 'c',
                    'd': True,
                    'e': None}},
            'b': [{'i': id(a2), 't': type_id(a2), 'v': {'0': 0, 'a': 1}}, 'b', 1],  # noqa: E501
            'c': {
                'i': tree['v']['c']['i'],
                't': id(dict),
                'v': {
                    'a': 1,
                    'b': [1, 2, {'i': id(a3), 't': type_id(a3), 'v': {'0': 0}}]}},  # noqa: E501
            'circular': {'i': id(root), 't': type_id(root), 'v': None}}}

    assert json.dumps(tree)


def test_get_object_tree_shallow(instance):
    root, *_ = instance
    tree, refs = serialize.get_object_tree(root, shallow=True)
    assert tree == {
        'i': id(root),
        't': type_id(root),
        'v': {
            '0': 0, 'a': {}, 'b': {}, 'c': {},
            'circular': {'i': id(root), 't': type_id(root), 'v': None}}}
    assert refs == {id(root): root, type_id(root): type(root)}


def test_ordered_dict():
    b = OrderedDict()
    b['b'] = 1
    a = {'a': b}
    tree, refs = serialize.get_object_tree(a)
    assert tree == {
        'i': id(a),
        't': type_id(a),
        'v': {'a': {
                'i': id(b),
                't': type_id(b),
                'v': {'b': 1}}}}
