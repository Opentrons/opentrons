from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Liquid:
    _id: str
    display_name: str
    description: str
    display_color: Optional[str]
