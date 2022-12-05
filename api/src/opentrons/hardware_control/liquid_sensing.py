from dataclasses import dataclass


@dataclass
class LiquidSenseParams:
    threshold: float
    min_liquid_height: float
    max_liquid_height: float
