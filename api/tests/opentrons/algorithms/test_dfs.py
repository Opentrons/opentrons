"""Test the DFS module.

Generic testing of a depth first search algo
"""
from pathlib import Path

import pytest
import json
import os
from typing import Callable, List, Tuple, Any

from opentrons.algorithms import dfs, types


def convert_to_vertex(
        graph_dict: dict,
        cast_type: Callable) -> List[types.GenericNode]:
    """Convert to Vertex.

    Helper function to convert a json file to a list of
    generic nodes to help build the graph.
    """
    graph = []
    for key, value in graph_dict.items():
        vertex = types.GenericNode(
            name=cast_type(key),
            sub_names=value)
        graph.append(vertex)
    return graph


def load_graph() -> Tuple[Tuple[List[types.GenericNode], str],
                          Tuple[List[types.GenericNode], str]]:
    """Load Graphs.

    Helper function to load the test json graph files.
    """
    path = Path(os.path.abspath(os.path.dirname(__file__)))
    with (path / 'fixture_alphabetical_graph.json').open() as f:
        alphabet = convert_to_vertex(json.load(f), str)
    with (path / 'fixture_numerical_graph.json').open() as f:
        numbers = convert_to_vertex(json.load(f), int)
    return (alphabet, 'string'), (numbers, 'integer')


@pytest.fixture(scope="session", params=load_graph())
def dfs_graph(request: Any) -> Tuple[dfs.DFS, str]:
    """Build DFS class.

    Fixture that sets up a dfs class for either an
    alphabetical or numerical graph.
    """
    graph = request.param[0]
    _type = request.param[1]
    yield dfs.DFS(graph), _type


def test_vertices(dfs_graph: dfs.DFS) -> None:
    """Test vertices.

    Test adding and removing the vertices of a graph.

    Here we should check for the new vertice in the lookup
    table of the graph as well as the sorted graph attribute.
    """
    _dfs, _type = dfs_graph
    graph = _dfs.graph
    if _type == 'string':
        additional_vertex = types.GenericNode(
            name='K', sub_names=['H', 'J', 'A'])
    else:
        additional_vertex = types.GenericNode(
            name=12, sub_names=[1, 9, 5]
        )
    graph.add_vertex(additional_vertex)
    vertex_obj = graph.get_vertex(additional_vertex.name)
    assert additional_vertex.name in graph._lookup_table.keys()
    assert vertex_obj in graph._sorted_graph
    graph.remove_vertex(additional_vertex)
    assert additional_vertex not in graph._lookup_table.keys()
    assert vertex_obj not in graph._sorted_graph


def test_neighbors(dfs_graph: dfs.DFS) -> None:
    """Test neighbors.

    Test adding neighbors to a vertex.
    Neighbors act as keys for a given vertex.
    """
    _dfs, _type = dfs_graph
    graph = _dfs.graph
    if _type == 'string':
        key = 'A'
        neighbor = 'J'
        og_neighbors = ['B', 'E']
        sorted_neighbors = ['B', 'E', 'J']
    else:
        key = 1
        neighbor = 4
        og_neighbors = [2, 5]
        sorted_neighbors = [2, 4, 5]
    vertex = graph.get_vertex(key)
    assert vertex.neighbors == og_neighbors
    vertex.add_neighbor(neighbor)
    assert vertex.neighbors == sorted_neighbors
    vertex.remove_neighbor(neighbor)
    assert vertex.neighbors == og_neighbors


def test_depth_first_search(dfs_graph: dfs.DFS) -> None:
    """Test the depth first search algorithm.

    The method should dig down into the bottom leaf node
    before backtracking up to find unvisited nodes.
    """
    _dfs, _type = dfs_graph
    visited_vertices = _dfs.dfs()
    if _type == 'string':
        sort = {'A', 'B', 'F', 'G', 'C', 'J', 'I', 'H', 'D', 'E'}
    else:
        sort = {1, 2, 6, 7, 3, 10, 9, 8, 4, 5}
    assert sort == visited_vertices
