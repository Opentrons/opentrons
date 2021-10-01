"""Message types."""
from typing import Union, Optional

from typing_extensions import get_args

from opentrons_hardware.drivers.can_bus.messages import message_definitions as defs
from opentrons_hardware.drivers.can_bus.constants import MessageId

MessageDefinition = Union[
    defs.HeartbeatRequest,
    defs.HeartbeatResponse,
    defs.DeviceInfoRequest,
    defs.DeviceInfoResponse,
    defs.StopRequest,
    defs.GetStatusRequest,
    defs.GetStatusResponse,
    defs.MoveRequest,
    defs.SetupRequest,
    defs.GetSpeedRequest,
    defs.GetSpeedResponse,
    defs.WriteToEEPromRequest,
    defs.ReadFromEEPromRequest,
    defs.ReadFromEEPromResponse,
]


def get_definition(message_id: MessageId) -> Optional[MessageDefinition]:
    """Get the message type for a message id.

    Args:
        message_id: A message id

    Returns: The message definition for a type

    """
    for i in get_args(MessageDefinition):
        if i.message_id == message_id:
            # get args returns Tuple[Any...]
            return i  # type: ignore

    return None
