"""Graph Builder.

Generic graph builder classes.
"""
from __future__ import annotations

from typing import List, Dict, Callable, Sequence, Generic

from .types import VertexLike, VertexName


class Vertex(Generic[VertexName, VertexLike]):
    """Vertex class.

    A class to hold information about each vertex
    of a graph.
    """

    def __init__(self, vertex: VertexLike, neighbors: List[VertexName]) -> None:
        """Vertex class initializer.

        :param vertex: A node dataclass
        :param neighbors: A list of node names who
        are neighbors to the node dataclass
        """
        self._vertex = vertex
        self._neighbors = neighbors

    @property
    def name(self) -> VertexName:
        """Vertex class property: name.

        :returns: Name of the vertex
        """
        return self._vertex.name

    @property
    def vertex(self) -> VertexLike:
        """Vertex class property: vertex.

        :returns: The node dataclass
        """
        return self._vertex

    @property
    def neighbors(self) -> List[VertexName]:
        """Vertex class property: neighbors.

        :returns: The list of node names who are
        neighbors with the vertex.
        """
        return self._neighbors

    def add_neighbor(self, vertex_name: VertexName) -> None:
        """Add a neighbor.

        :param vertex_name: The name of the neighbor
        """
        self._neighbors.append(vertex_name)
        self._neighbors.sort()

    def remove_neighbor(self, vertex_name: VertexName) -> None:
        """Remove a neighbor.

        :param vertex_name: The name of the neighbor
        """
        if vertex_name in self._neighbors:
            self._neighbors.remove(vertex_name)


def default_sort(vertex: Vertex) -> VertexName:
    """Sort function default for a graph.

    By default, a graph's nodes will be searched
    by the name of the node. Generally, the name
    should either be a string or an integer.
    """
    return vertex.name


class Graph(Generic[VertexName, VertexLike]):
    """Graph class.

    A class to handle functions moving through the
    graph.
    """

    # Note, the type of sort_by is actually
    # Callable[[Vertex], VertexName] however there
    # is an issue when using generics for functions
    # passed into sort. See
    # https://github.com/python/typing/issues/760
    def __init__(
        self,
        sorted_graph: List[Vertex],
        lookup_table: Dict[VertexName, Vertex],
        sort_by: Callable[[Vertex], str],
    ) -> None:
        """Graph class initializer.

        :param sorted_graph: The initial graph, sorted
        and converted to vertex objects.
        :param lookup_table: A lookup table keyed by vertex
        name and with a value of the vertex object
        :param sort_by: The callable function used to sort
        the graph nodes in priority order.
        """
        self._sort_by = sort_by
        self._sorted_graph = sorted_graph
        self._lookup_table = lookup_table

    @classmethod
    def build(cls, graph: List[VertexLike], sort_by: Callable = default_sort) -> Graph:
        """Graph class builder.

        :param graph: A list of nodes to add to the graph.
        :param sort_by: The function used to sort the graph
        in priority order.
        :returns: A graph class
        """
        sorted_graph = []
        lookup_table = {}
        for vertex in graph:
            vertex_obj = cls.build_vertex(vertex)
            lookup_table[vertex.name] = vertex_obj
            sorted_graph.append(vertex_obj)
        sorted_graph.sort(key=sort_by)
        return cls(sorted_graph, lookup_table, sort_by)

    @property
    def graph(self) -> Sequence[Vertex]:
        """Graph class property: graph.

        :returns: A list of sorted vertex objects
        """
        return self._sorted_graph

    @staticmethod
    def build_vertex(vertex: VertexLike) -> Vertex:
        """Build a vertex.

        Use this to sort the neighbors and then build
        a vertex using a node dataclass.
        :param vertex: A node dataclass
        :returns: vertex object
        """
        vertex.sub_names.sort()
        return Vertex(vertex, vertex.sub_names)

    def add_vertex(self, vertex: VertexLike) -> None:
        """Add a vertex.

        :param vertex: A node dataclass
        """
        new_vertex = self.build_vertex(vertex)
        if new_vertex not in self._lookup_table.values():
            self._lookup_table[new_vertex.name] = new_vertex
            self._sorted_graph.append(new_vertex)
        self._sorted_graph.sort(key=self._sort_by)

    def remove_vertex(self, vertex: VertexLike) -> None:
        """Remove a vertex.

        :param vertex: A node dataclass
        """
        if vertex.name in self._lookup_table.keys():
            vertex_to_remove = self._lookup_table[vertex.name]
            del self._lookup_table[vertex.name]
            self._sorted_graph.remove(vertex_to_remove)

    def get_vertex(self, vertex_name: VertexName) -> Vertex:
        """Get a vertex.

        :param vertex_name: The name of the vertex
        :returns: The vertex object
        """
        return self._lookup_table[vertex_name]
