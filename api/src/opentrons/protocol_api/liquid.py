from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class LoadedLiquid:
    id: str
    display_name: str
    description: str
    display_color: Optional[str]
