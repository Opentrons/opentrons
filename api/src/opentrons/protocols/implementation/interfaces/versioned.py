from __future__ import annotations

from abc import ABC, abstractmethod

from opentrons.protocols.types import APIVersion


class ApiVersioned(ABC):

    @abstractmethod
    def get_api_version(self) -> APIVersion:
        ...
