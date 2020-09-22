from abc import abstractmethod

from opentrons.protocol_api.implementation.interfaces.modules.module_context \
    import AbstractModuleContextImplementation


class AbstractTemperatureModuleContextImplementation(
    AbstractModuleContextImplementation
):

    @abstractmethod
    def set_temperature(self, celsius: float) -> None:
        ...

    @abstractmethod
    def start_set_temperature(self, celsius: float) -> None:
        ...

    @abstractmethod
    def await_temperature(self, celsius: float) -> None:
        ...

    @abstractmethod
    def deactivate(self) -> None:
        ...

    @abstractmethod
    def get_temperature(self) -> float:
        ...

    @abstractmethod
    def get_target_temperature(self) -> float:
        ...

    @abstractmethod
    def get_status(self) -> str:
        ...
