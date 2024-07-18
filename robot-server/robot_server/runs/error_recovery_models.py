"""Request and response models for dealing with error recovery policies."""
from enum import Enum
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResourceModel


class valueMatchType(str, Enum):

    IGNORE_AND_CONTINUE = "ignore"
    FAIL_RUN = "fail-run"
    WAIT_FOR_RECOVERY = "wait-for-recovery"


class ErrorRecoveryRule(BaseModel):
    """Request model for new error recovery rule creation."""

    commandType: str
    errorType: str
    ifMatch: valueMatchType
