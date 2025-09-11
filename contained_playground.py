import matplotlib.pyplot as plt
import pyvista as pv
import networkx as nx
from shapely.geometry import box
from shapely.geometry.base import BaseGeometry
from typing import List, Dict, Any


class Geometry:
    def __init__(
        self,
        name: str,
        polygon: BaseGeometry,
        zmin: float = 0,
        zmax: float = 1
    ) -> None:
        self.name: str = name
        self.shape: BaseGeometry = polygon
        self.zmin: float = zmin
        self.zmax: float = zmax


class GeometryQueryAPI:
    def __init__(self, graph: nx.DiGraph) -> None:
        self.G: nx.DiGraph = graph

    def get_children(self, node: str, relation: str) -> List[str]:
        return [v for u, v, d in self.G.out_edges(node, data=True) if d["relation"] == relation]

    def get_parents(self, node: str, relation: str) -> List[str]:
        return [u for u, v, d in self.G.in_edges(node, data=True) if d["relation"] == relation]

    def get_related(
        self, 
        node: str, 
        relation: str, 
        direction: str = "out", 
        transitive: bool = False
    ) -> List[str]:
        """
        Generic relation query.
        direction = "out" (children), "in" (parents), "both" (undirected).
        transitive = whether to follow edges recursively.
        """
        results: set[str] = set()
        stack: List[str] = [node]

        while stack:
            current = stack.pop()

            if direction in ("out", "both"):
                neighbors = self.get_children(current, relation)
                for n in neighbors:
                    if n not in results:
                        results.add(n)
                        if transitive:
                            stack.append(n)

            if direction in ("in", "both"):
                neighbors = self.get_parents(current, relation)
                for n in neighbors:
                    if n not in results:
                        results.add(n)
                        if transitive:
                            stack.append(n)

        return list(results)

    def contains(self, node: str, transitive: bool = False) -> List[str]:
        return self.get_related(node, "contains", "out", transitive)

    def inside_of(self, node: str, transitive: bool = False) -> List[str]:
        return self.get_related(node, "inside_of", "in", transitive)

    def on_top_of(self, node: str, transitive: bool = False) -> List[str]:
        return self.get_related(node, "on_top_of", "in", transitive)

    def below(self, node: str, transitive: bool = False) -> List[str]:
        return self.get_related(node, "on_top_of", "out", transitive)

    def adjacent_to(self, node: str) -> List[str]:
        return self.get_related(node, "adjacent_to", "both", False)

    def collides_with(self, node: str) -> List[str]:
        return self.get_related(node, relation="collides", direction="both")


def contains(A: Geometry, B: Geometry) -> bool:
    return A.shape.contains(B.shape) and A.zmin <= B.zmin and A.zmax >= B.zmax

def inside_of(A: Geometry, B: Geometry) -> bool:
    return contains(B, A)

def on_top_of(A: Geometry, B: Geometry, tol: float = 0.01) -> bool:
    overlap = A.shape.intersects(B.shape)
    return overlap and abs(A.zmin - B.zmax) <= tol

def adjacent_to(A: Geometry, B: Geometry) -> bool:
    return A.shape.touches(B.shape) and A.zmin == B.zmin and A.zmax == B.zmax

def colliding(A: Geometry, B: Geometry, z_tol: float = 0.01) -> bool:
    xy_overlap = A.shape.intersects(B.shape)
    neither_contains = not contains(A,B) and not contains(B,A)
    not_stacked = abs(A.zmin - B.zmax) > z_tol and abs(B.zmin - A.zmax) > z_tol
    return xy_overlap and neither_contains and not_stacked


def build_relationship_graph(geometries: List[Geometry]) -> nx.DiGraph:
    G = nx.DiGraph()
    for g in geometries:
        G.add_node(g.name)
    for i, A in enumerate(geometries):
        for B in geometries[i+1:]:
            if contains(A,B):
                G.add_edge(A.name, B.name, relation="contains")
                G.add_edge(B.name, A.name, relation="inside_of")
            elif contains(B,A):
                G.add_edge(B.name, A.name, relation="contains")
                G.add_edge(A.name, B.name, relation="inside_of")
            if on_top_of(A,B):
                G.add_edge(A.name, B.name, relation="on_top_of")
                print(A.name, "is ontop of", B.name)
            elif on_top_of(B,A):
                G.add_edge(B.name, A.name, relation="on_top_of")
                print(A.name, "is below of", B.name)
            if adjacent_to(A,B):
                G.add_edge(A.name, B.name, relation="adjacent_to")
                G.add_edge(B.name, A.name, relation="adjacent_to")
            if colliding(A,B):
                G.add_edge(A.name, B.name, relation="collides")
                G.add_edge(B.name, A.name, relation="collides")
    return G


def render_dag(graph: nx.DiGraph) -> None:
    pos: Dict[str, Any] = nx.spring_layout(graph, seed=42)
    nx.draw(graph, pos, with_labels=True, node_size=2000,
            node_color="lightblue", font_size=10)
    edge_labels: Dict[tuple[str, str], str] = nx.get_edge_attributes(graph, "relation")
    nx.draw_networkx_edge_labels(graph, pos, edge_labels=edge_labels, font_size=8)
    plt.show()


def render_3d_scene(geometries: List[Geometry], G: nx.DiGraph) -> None:
    relation_colors: Dict[str, str] = {
        "contains": "skyblue",
        "inside_of": "lightgreen",
        "on_top_of": "orange",
        "adjacent_to": "violet",
        "collides": "red",
        "default": "lightgray"
    }

    colors: Dict[str, str] = {}
    for geom in geometries:
        node = geom.name
        relations = [d["relation"] for _,_,d in G.edges(node,data=True)] + \
                    [d["relation"] for _,_,d in G.in_edges(node,data=True)]
        if "contains" in relations:
            colors[node] = relation_colors["contains"]
        elif "inside_of" in relations:
            colors[node] = relation_colors["inside_of"]
        elif "on_top_of" in relations:
            colors[node] = relation_colors["on_top_of"]
        elif "adjacent_to" in relations:
            colors[node] = relation_colors["adjacent_to"]
        else:
            colors[node] = relation_colors["default"]

    # Draw the bounding boxes
    p = pv.Plotter()
    for geom in geometries:
        x0,y0,x1,y1 = geom.shape.bounds
        z0,z1 = geom.zmin, geom.zmax
        dx,dy,dz = x1-x0, y1-y0, z1-z0
        cube = pv.Cube(center=((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),
                       x_length=dx, y_length=dy, z_length=dz)
        print(geom.name, colors[geom.name])
        p.add_mesh(cube, color=colors[geom.name], opacity=0.5,
                   show_edges=True, edge_color="black")
        
        p.add_point_labels(
            [[(x0+x1)/2, (y0+y1)/2, (z0+z1)/2]],
            [geom.name], font_size=24
        )

    # Draw collisions as 2D outlines on top of the bottom object 
    for i, A in enumerate(geometries):
        for B in geometries[i+1:]:
            if colliding(A, B):
                inter = A.shape.intersection(B.shape)
                if inter.is_empty:
                    continue

                # Determine which object is lower
                z_top = A.zmax if A.zmax <= B.zmax else B.zmax

                polygons: List[BaseGeometry] = []
                if inter.geom_type == "Polygon":
                    polygons = [inter]
                elif inter.geom_type == "MultiPolygon":
                    polygons = list(inter.geoms)
                elif inter.geom_type == "LineString":
                    polygons = [inter]

                # Draw the outline of the intersection polygon
                for poly in polygons:
                    coords = list(poly.exterior.coords) if poly.geom_type == "Polygon" else list(poly.coords)
                    for j in range(len(coords)-1):
                        start = [coords[j][0], coords[j][1], z_top]
                        end   = [coords[j+1][0], coords[j+1][1], z_top]
                        line = pv.Line(start, end)
                        p.add_mesh(line, color="red", line_width=3)

    p.add_legend_scale()
    p.show_grid()
    p.show()


if __name__=="__main__":
    base = Geometry("Base", box(0,0,4,4), zmin=0, zmax=2)
    obj1 = Geometry("Obj1", box(1,1,3,3), zmin=2, zmax=3)
    obj2 = Geometry("Obj2", box(2.5,2.5,3,3), zmin=2.5, zmax=4)
    obj3 = Geometry("Obj3", box(2.5,2.5,3,3), zmin=0.5, zmax=1.5)
    geometries = [base, obj1, obj2, obj3]

    G = build_relationship_graph(geometries)
    api = GeometryQueryAPI(G)

    print("Base contains (direct):", api.contains("Base"))
    print("Base contains (all):", api.contains("Base", transitive=True))
    print("Above Base:", api.on_top_of("Base", transitive=False))
    print("Above Base (all):", api.on_top_of("Base", transitive=True))
    print("Below Obj1:", api.below("Obj1", transitive=True))

    # render_dag(G)
    render_3d_scene(geometries, G)

