from typing_extensions import Protocol


class Simulatable(Protocol):
    """Protocol specifying ability to simulate"""

    @property
    def is_simulator(self) -> bool:
        """`True` if this is a simulator; `False` otherwise."""
        ...
