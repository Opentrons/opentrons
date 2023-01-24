from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Liquid:
    """A Liquid to load into a well.

    Attributes:
        name: A human-readable name for this liquid.
        description: An optional description.
        display_color: An optional display color of the liquid.
    """

    _id: str
    name: str
    description: Optional[str]
    display_color: Optional[str]
