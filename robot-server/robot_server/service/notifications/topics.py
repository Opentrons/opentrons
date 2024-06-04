"""Notification topics."""
from enum import Enum


_TOPIC_BASE = "robot-server"


class Topics(str, Enum):
    """Notification Topics

    MQTT functional equivalent of endpoints.
    """

    MAINTENANCE_RUNS_CURRENT_RUN = f"{_TOPIC_BASE}/maintenance_runs/current_run"
    RUNS_COMMANDS_LINKS = f"{_TOPIC_BASE}/runs/commands_links"
    RUNS = f"{_TOPIC_BASE}/runs"
    DECK_CONFIGURATION = f"{_TOPIC_BASE}/deck_configuration"
    RUNS_PRE_SERIALIZED_COMMANDS = f"{_TOPIC_BASE}/runs/pre_serialized_commands"
