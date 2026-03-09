from typing import Optional, Dict, Any
from opentrons_shared_data.errors.exceptions import (
    MotionPlanningFailureError,
    InvalidInstrumentData,
    RobotInUseError,
)


class OutOfBoundsMove(MotionPlanningFailureError):
    def __init__(self, message: str, detail: Dict[str, Any]):
        super().__init__(message=message, detail=detail)


class InvalidCriticalPoint(MotionPlanningFailureError):
    def __init__(self, cp_name: str, instr: str, message: Optional[str] = None):
        super().__init__(
            message=(message or f"Critical point {cp_name} is invalid for a {instr}."),
            detail={"instrument": instr, "critical point": cp_name},
        )


class InvalidPipetteName(InvalidInstrumentData):
    """Raised for an invalid pipette."""

    def __init__(self, name: int, mount: str) -> None:
        super().__init__(
            message=f"Invalid pipette name key {name} on mount {mount}",
            detail={"mount": mount, "name": str(name)},
        )


class InvalidPipetteModel(InvalidInstrumentData):
    """Raised for a pipette with an unknown model."""

    def __init__(self, name: str, model: str, mount: str) -> None:
        super().__init__(detail={"mount": mount, "name": name, "model": model})


class UpdateOngoingError(RobotInUseError):
    """Error when an update is already happening."""

    def __init__(self, message: str) -> None:
        super().__init__(message=message)
