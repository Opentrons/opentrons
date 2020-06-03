from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from opentrons.calibration.check.models import SessionType

from .command_execution.base_command_queue import CommandQueue
from .command_execution.base_executor import CommandExecutor
from .configuration import SessionConfiguration
from robot_server.service.session import models


@dataclass(frozen=True)
class SessionMetaData:
    name: Optional[str]
    description: Optional[str]
    identifier: models.IdentifierType = field(
        default_factory=models.create_identifier
    )
    created_on: datetime = field(default_factory=datetime.utcnow)


class Session(ABC):
    """Base class of all sessions"""

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData):
        """
        Constructor

        :param configuration: Data and utilities common to all session types
        :param instance_meta: Session metadata
        """
        self._configuration = configuration
        self._instance_meta = instance_meta

    @classmethod
    async def create(cls,
                     configuration: SessionConfiguration,
                     name: Optional[str] = None,
                     description: Optional[str] = None):
        """
        Create a session object

        :param configuration: Data and utilities common to all session types
        :param name: Optional name for the session
        :param description: Optional description of the session
        :return: A new session
        """
        return cls(configuration=configuration,
                   instance_meta=SessionMetaData(
                       name=name,
                       description=description
                   ))

    def get_response_model(self) -> models.Session:
        """Get the response model"""
        return models.Session(sessionType=self.session_type,
                              details=self._get_response_details())

    @abstractmethod
    def _get_response_details(self) -> models.SessionDetails:
        """Get session type specific details"""
        pass

    async def clean_up(self):
        """Called before session is deleted"""
        pass

    @property
    @abstractmethod
    def command_executor(self) -> CommandExecutor:
        """Accessor for the command executor"""
        pass

    @property
    @abstractmethod
    def command_queue(self) -> CommandQueue:
        pass

    @property
    def meta(self) -> SessionMetaData:
        return self._instance_meta

    @property
    @abstractmethod
    def session_type(self) -> SessionType:
        pass

    def __str__(self) -> str:
        return f"Session(" \
               f"session_type={self.session_type}," \
               f"meta={self.meta}," \
               f")"
