"""Notification topics."""
from enum import Enum


_TOPIC_BASE = "robot-server"


class Topics(str, Enum):
    """Notification Topics

    MQTT functional equivalent of endpoints.
    """

    # /maintenance_runs
    MAINTENANCE_RUNS_CURRENT_RUN = f"{_TOPIC_BASE}/maintenance_runs/current_run"

    # /runs
    RUNS_CURRENT_COMMAND = f"{_TOPIC_BASE}/runs/current_command"
    RUNS = f"{_TOPIC_BASE}/runs"
    DECK_CONFIGURATION = f"{_TOPIC_BASE}/deck_configuration"
    RUNS_PRE_SERIALIZED_COMMANDS = f"{_TOPIC_BASE}/runs/pre_serialized_commands"

    # /robot
    LIGHTS = f"{_TOPIC_BASE}/robot/lights"
