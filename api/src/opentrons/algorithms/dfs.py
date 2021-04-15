"""Depth first search.

Search a generic graph down to its leaf
nodes first before back-tracking up the tree.
"""

from typing import List, Set, Generic

from .graph import Graph
from .types import VertexLike, VertexName


class DFS(Generic[VertexName]):
    """Depth first search class.

    This class will build a graph object and then
    perform a depth first search on the graph.
    """

    def __init__(self, graph: List[VertexLike]) -> None:
        """DFS Initializer.

        :param graph: A list of nodes you wish to add to
        the graph.
        """
        self._graph = Graph.build(graph)

    @property
    def graph(self) -> Graph:
        """DFS property: graph.

        :returns: the graph object in which
        dfs is being performed on.
        """
        return self._graph

    def dfs(self) -> Set[VertexName]:
        """Depth first search.

        :returns: the set of visited vertices
        in depth first search order.
        """
        visited_vertices: Set[VertexName] = set()
        for node in self.graph.graph:
            if node not in visited_vertices:
                visited_vertices.add(node.name)
            for neighbor in node.neighbors:
                if neighbor not in visited_vertices:
                    visited_vertices.add(neighbor)
        return visited_vertices
