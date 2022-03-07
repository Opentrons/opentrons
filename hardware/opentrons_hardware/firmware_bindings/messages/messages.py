"""Message types."""
from functools import lru_cache
from typing import Union, Optional, Type

from typing_extensions import get_args

from . import message_definitions as defs
from ..constants import MessageId

MessageDefinition = Union[
    defs.HeartbeatRequest,
    defs.HeartbeatResponse,
    defs.DeviceInfoRequest,
    defs.DeviceInfoResponse,
    defs.TaskInfoRequest,
    defs.TaskInfoResponse,
    defs.StopRequest,
    defs.GetStatusRequest,
    defs.GetStatusResponse,
    defs.EnableMotorRequest,
    defs.DisableMotorRequest,
    defs.MoveRequest,
    defs.SetupRequest,
    defs.WriteToEEPromRequest,
    defs.ReadFromEEPromRequest,
    defs.ReadFromEEPromResponse,
    defs.AddLinearMoveRequest,
    defs.GetMoveGroupRequest,
    defs.GetMoveGroupResponse,
    defs.ExecuteMoveGroupRequest,
    defs.ClearAllMoveGroupsRequest,
    defs.MoveCompleted,
    defs.SetMotionConstraints,
    defs.GetMotionConstraintsRequest,
    defs.GetMotionConstraintsResponse,
    defs.WriteMotorDriverRegister,
    defs.ReadMotorDriverRequest,
    defs.ReadMotorDriverResponse,
    defs.WriteMotorCurrentRequest,
    defs.ReadPresenceSensingVoltageRequest,
    defs.ReadPresenceSensingVoltageResponse,
    defs.AttachedToolsRequest,
    defs.PushToolsDetectedNotification,
    defs.FirmwareUpdateInitiate,
    defs.FirmwareUpdateData,
    defs.FirmwareUpdateDataAcknowledge,
    defs.FirmwareUpdateComplete,
    defs.FirmwareUpdateCompleteAcknowledge,
    defs.FirmwareUpdateStatusRequest,
    defs.FirmwareUpdateStatusResponse,
    defs.FirmwareUpdateEraseAppRequest,
    defs.FirmwareUpdateEraseAppResponse,
    defs.FirmwareUpdateStartApp,
    defs.ReadLimitSwitchRequest,
    defs.ReadLimitSwitchResponse,
    defs.ReadFromSensorRequest,
    defs.WriteToSensorRequest,
    defs.BaselineSensorRequest,
    defs.SetSensorThresholdRequest,
    defs.ReadFromSensorResponse,
    defs.SensorThresholdResponse,
    defs.HomeRequest,
]


@lru_cache(maxsize=None)
def get_definition(message_id: MessageId) -> Optional[Type[MessageDefinition]]:
    """Get the message type for a message id.

    Args:
        message_id: A message id

    Returns: The message definition for a type

    """
    # Dumb linear search, but the result is memoized.
    for i in get_args(MessageDefinition):
        if i.message_id == message_id:
            # get args returns Tuple[Any...]
            return i  # type: ignore[no-any-return]

    return None
