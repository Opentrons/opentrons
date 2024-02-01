from enum import Enum


_TOPIC_BASE = "robot-server"


class Topics(Enum):
    """MQTT Quality of Service.

    Represents the level of delivery
    guarantee for a specific message.
    """

    MAINTENANCE_RUNS_CURRENT_RUN = f"{_TOPIC_BASE}/maintenance_runs/current_run"
    RUNS_CURRENT_COMMAND = f"{_TOPIC_BASE}/runs/current_command"
    RUNS = f"{_TOPIC_BASE}/runs"
