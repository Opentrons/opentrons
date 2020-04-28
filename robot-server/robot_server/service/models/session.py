from enum import Enum

from pydantic import BaseModel, Field


class SessionType(str, Enum):
    calibration_check = "calibration_check"
    deck_calibration = "deck_calibration"
    protocol = "protocol"


class Session(BaseModel):
    """Description of session"""
    session_type: SessionType =\
        Field(..., description="The type of the session")
    session_id: str = \
        Field(..., description="The unique identifier the session")
