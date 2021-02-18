"""
Depth first search.

Search a generic graph down to its leaf
nodes first before back-tracking up the tree.
"""

from typing import List, Set, Generic, Optional

from .graph import Graph, Vertex
from .types import VertexLike, VertexName


class DFS(Generic[VertexName]):
    """
    Depth first search class.

    This class will build a graph object and then
    perform a depth first search on the graph.
    """

    def __init__(self, graph: List[VertexLike]) -> None:
        """
        DFS Initializer.

        :param graph: A list of nodes you wish to add to
        the graph.
        """
        self._graph = Graph.build(graph)
        self._current_vertex = None
        self._visited_vertices: Set[VertexName] = set()

    @property
    def current_vertex(self) -> Optional[Vertex]:
        """
        DFS property: current_vertex.

        :returns: a Vertex object that is
        the current node in the dfs.
        """
        return self._current_vertex

    @current_vertex.setter
    def current_vertex(self, vertex: Optional[Vertex]) -> None:
        """
        DFS setter: current_vertex.

        :param vertex: a Vertex object

        See: https://github.com/python/mypy/issues/3004 about
        properties with optional parameters not currently
        being supported
        """
        self._current_vertex = vertex  # type: ignore

    @property
    def visited_vertices(self) -> Set[VertexName]:
        """
        DFS property: visited_vertices.

        :returns: a Set of visited vertices
        """
        return self._visited_vertices

    @property
    def graph(self) -> Graph:
        """
        DFS property: graph.

        :returns: the graph object in which
        dfs is being performed on.
        """
        return self._graph

    def _dfs(self) -> None:
        if self.current_vertex:
            if self.current_vertex.name not in self.visited_vertices:
                self._visited_vertices.add(self.current_vertex.name)
            neighbors = self.current_vertex.neighbors
            for neighbor in neighbors:
                if neighbor not in self.visited_vertices:
                    self.current_vertex = self.graph.get_vertex(neighbor)
                    self._visited_vertices.add(neighbor)
                    self._dfs()

    def dfs(self) -> Set[VertexName]:
        """
        Depth first search.

        :returns: the set of visited vertices
        in depth first search order.
        """
        for node in self.graph.graph:
            self.current_vertex = node
            self._dfs()
        return self._visited_vertices

    def reset(self) -> None:
        """
        Reset the dfs nodes visited.

        If you add new nodes to the graph, dfs should
        be performed again.
        """
        self._current_vertex = None
        self._visited_vertices = set()
