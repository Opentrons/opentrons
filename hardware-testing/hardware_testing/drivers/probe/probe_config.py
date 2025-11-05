from typing_extensions import Final
from dataclasses import dataclass

@dataclass(frozen=True)
class ProbeConfig:
    slot: int
    safe_z_height: float
    probe_deck_safe_z: float
    fast_probe_speed: float
    slow_probe_speed: float
    edge_offset: float
    bound_offset: float
    debounce_offset: float
    shank_height: float
    probe_end_diameter: float
    probe_end_radius: float

DEFAULT_PROBE_CONFIG: Final[ProbeConfig] = ProbeConfig(
    slot=5,
    safe_z_height = 150.0,
    probe_deck_safe_z = 100.0,
    fast_probe_speed = 5.0,
    slow_probe_speed = 1.0,
    edge_offset = 6.0
    bound_offset = 2.0,
    debounce_offset = 5.0,
    shank_height = 22.0,
    probe_end_diameter = 2.0,
    probe_end_radius = 1.0,
)
