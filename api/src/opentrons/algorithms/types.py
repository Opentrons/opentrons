"""Algorithm types.

Any type definitions required for the algorithms
module should be put in this file.
"""

from typing import TypeVar, Generic, List, Union
from dataclasses import dataclass


NameBinding = Union[int, str, bytes, float]
"""The acceptable types for VertexName. Must support less than."""

VertexName = TypeVar("VertexName", bound=NameBinding)


@dataclass(frozen=True)
class GenericNode(Generic[VertexName]):
    """Generic graph node dataclass.

    A dataclass to hold information about a
    graph node. Information should not be
    mutated about the node.
    """

    name: VertexName
    sub_names: List[VertexName]

    def __hash__(self) -> int:
        """Hash function.

        To have a unique set of nodes, they must
        all have a unique hash. Lists are not
        hashable which is why we need to unpack
        the list here.
        """
        return hash((self.name, *self.sub_names))
