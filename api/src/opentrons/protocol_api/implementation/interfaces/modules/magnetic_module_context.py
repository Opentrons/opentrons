from abc import abstractmethod

from opentrons.protocol_api.implementation.interfaces.modules.module_context \
    import AbstractModuleContextImplementation


class AbstractMagneticModuleContextImplementation(
    AbstractModuleContextImplementation
):

    @abstractmethod
    def calibrate(self) -> None:
        ...

    @abstractmethod
    def engage(self,
               height: float = None,
               offset: float = None,
               height_from_base: float = None) -> None:
        ...

    @abstractmethod
    def disengage(self) -> None:
        ...

    @abstractmethod
    def get_status(self) -> str:
        ...
