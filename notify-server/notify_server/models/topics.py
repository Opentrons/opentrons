"""Event topics."""
import enum


class RobotEventTopics(enum.Enum):
    """All robot-server event topics."""

    HARDWARE_EVENT = "hardware_events"

    def __str__(self) -> str:
        """Topic string."""
        return str(self.value)
