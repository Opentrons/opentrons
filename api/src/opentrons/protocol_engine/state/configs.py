# Use for simulating pause commands.. engine_state.config.ignore_pause
from dataclasses import dataclass
from .abstract_store import HasState


@dataclass(frozen=True)
class EngineConfigs:
    """Configurations for Protocol Engine."""

    ignore_pause: bool = False


# create an engineconfigs view that would be used in state store
# or use a `get_configs()` method instead of configs() property. Both will make it easier to test


# class EngineConfigsView(HasState[EngineConfigs]):
#     """Read-only configs state view."""
#     _state = EngineConfigs
#
#     def __init__(self, state: EngineConfigs) -> None:
#         """Initialize the computed view of Engine Configs state.
#
#         Arguments:
#             state: Engine Configs state dataclass.
#         """
#         self._state = state
#
#     def get(self) -> EngineConfigs:
#         """Get Engine config data"""
