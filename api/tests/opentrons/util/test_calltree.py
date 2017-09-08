from opentrons.util import calltree
from functools import partial


def test_tree():
    stacks = [
        ['A'],
        ['A', 'B'],
        ['A', 'B', 'C', 'D'],
        ['A', 'B'],
        ['A', 'B', 'C', 'D'],
        ['A']
    ]

    assert calltree.tree(stacks) == [
        {'A': []},
        {'A': [{'B': []},
               {'B': [{'C': [{'D': []}]}]},
               {'B': []},
               {'B': [{'C': [{'D': []}]}]}]},
        {'A': []}]


def test_stack():
    stacks = []
    base_depth = list(calltree.stack()).index('test_stack') + 1

    def snapshot():
        stacks.append(list(calltree.stack())[base_depth:-1])

    def A(*fns):
        [fn() for fn in fns]

    def B(*fns):
        [fn() for fn in fns]

    def C(*fns):
        [fn() for fn in fns]

    stacks.clear()
    A(snapshot, partial(B, snapshot))
    assert stacks == [
        ['A'],
        ['A', 'B']
    ]

    stacks.clear()
    A(partial(B, snapshot), partial(C, snapshot))
    assert stacks == [
        ['A', 'B'],
        ['A', 'C']
    ]
