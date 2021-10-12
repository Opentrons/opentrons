"""Test the DFS module.

Generic testing of a depth first search algorithm.
"""
from pathlib import Path

import pytest
import json
import os

from opentrons.algorithms import dfs, types
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]


@pytest.fixture
def int_named_graph() -> dfs.DFS[int]:
    """Integer named graph."""
    path = Path(os.path.abspath(os.path.dirname(__file__)))
    with (path / "fixture_numerical_graph.json").open() as f:
        numbers = json.load(f)
        return dfs.DFS([types.GenericNode[int](int(k), v) for k, v in numbers.items()])


@pytest.fixture
def str_named_graph() -> dfs.DFS[str]:
    """String named graph."""
    path = Path(os.path.abspath(os.path.dirname(__file__)))
    with (path / "fixture_alphabetical_graph.json").open() as f:
        strings = json.load(f)
        return dfs.DFS([types.GenericNode[str](k, v) for k, v in strings.items()])


@pytest.mark.parametrize(
    argnames=["subject", "additional_vertex"],
    argvalues=[
        [lazy_fixture("int_named_graph"), types.GenericNode(name=12, sub_names=[1, 9, 5])],
        [lazy_fixture("str_named_graph"), types.GenericNode(name="K", sub_names=["H", "J", "A"])],
    ]
)
def test_vertices(subject: dfs.DFS[types.VertexName], additional_vertex: types.GenericNode[types.VertexName]) -> None:
    """Test vertices.

    Test adding and removing the vertices of a graph.

    Here we should check for the new vertice in the lookup
    table of the graph as well as the sorted graph attribute.
    """
    graph = subject.graph
    graph.add_vertex(additional_vertex)
    vertex_obj = graph.get_vertex(additional_vertex.name)
    assert additional_vertex.name in graph._lookup_table.keys()
    assert vertex_obj in graph._sorted_graph
    graph.remove_vertex(additional_vertex)
    assert additional_vertex.name not in graph._lookup_table.keys()
    assert vertex_obj not in graph._sorted_graph


def test_neighbors_int(str_named_graph: dfs.DFS[str]) -> None:
    """Test neighbors.

    Test adding neighbors to a vertex.
    Neighbors act as keys for a given vertex.
    """
    graph = str_named_graph.graph
    key = "A"
    neighbor = "J"
    og_neighbors = ["B", "E"]
    sorted_neighbors = ["B", "E", "J"]
    vertex = graph.get_vertex(key)
    assert vertex.neighbors == og_neighbors
    vertex.add_neighbor(neighbor)
    assert vertex.neighbors == sorted_neighbors
    vertex.remove_neighbor(neighbor)
    assert vertex.neighbors == og_neighbors


def test_neighbors_str(int_named_graph: dfs.DFS[int]) -> None:
    """Test neighbors.

    Test adding neighbors to a vertex.
    Neighbors act as keys for a given vertex.
    """
    graph = int_named_graph.graph
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


def test_depth_first_search_str(str_named_graph: dfs.DFS[str]) -> None:
    """Test the depth first search algorithm.

    The method should dig down into the bottom leaf node
    before backtracking up to find unvisited nodes.
    """
    visited_vertices = str_named_graph.dfs()
    sort = {"A", "B", "F", "G", "C", "J", "I", "H", "D", "E"}
    assert sort == visited_vertices


def test_depth_first_search_int(int_named_graph: dfs.DFS[int]) -> None:
    """Test the depth first search algorithm.

    The method should dig down into the bottom leaf node
    before backtracking up to find unvisited nodes.
    """
    visited_vertices = int_named_graph.dfs()
    sort = {1, 2, 6, 7, 3, 10, 9, 8, 4, 5}
    assert sort == visited_vertices
