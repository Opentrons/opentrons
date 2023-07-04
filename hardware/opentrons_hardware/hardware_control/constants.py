"""Hardware Control Constants."""
from typing_extensions import Final

BRUSHED_MOTOR_INTERRUPTS_PER_SEC: Final = 32000
"""The number of gripper motor interrupts per second."""

TIP_INTERRUPTS_PER_SEC: Final = 100000
"""The number of tip motor interrupts per second."""

INTERRUPTS_PER_SEC: Final = 200000
"""The number of motor interrupts per second."""
