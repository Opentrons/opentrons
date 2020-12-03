"""Event topics."""
import enum


class RobotEventTopics(str, enum.Enum):
    """All robot-server event topics."""

    HARDWARE_EVENTS = "hardware_events"

