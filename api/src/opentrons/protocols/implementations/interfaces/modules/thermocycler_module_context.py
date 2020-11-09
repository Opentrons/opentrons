from abc import abstractmethod
from typing import List

from opentrons.hardware_control.modules import ThermocyclerStep
from opentrons.protocols.implementations.interfaces.modules.module_context\
    import ModuleContextInterface


class ThermocyclerContextInterface(
    ModuleContextInterface
):

    @abstractmethod
    def open_lid(self) -> None:
        ...

    @abstractmethod
    def close_lid(self) -> None:
        ...

    @abstractmethod
    def set_block_temperature(self,
                              temperature: float,
                              hold_time_seconds: float = None,
                              hold_time_minutes: float = None,
                              ramp_rate: float = None,
                              block_max_volume: float = None) -> None:
        ...

    @abstractmethod
    def set_lid_temperature(self, temperature: float) -> None:
        ...

    @abstractmethod
    def execute_profile(self,
                        steps: List[ThermocyclerStep],
                        repetitions: int,
                        block_max_volume: float = None) -> None:
        ...

    @abstractmethod
    def deactivate_lid(self) -> None:
        ...

    @abstractmethod
    def deactivate_block(self) -> None:
        ...

    @abstractmethod
    def deactivate(self) -> None:
        ...

    @abstractmethod
    def get_lid_status(self) -> str:
        ...

    @abstractmethod
    def get_block_temperature_status(self) -> str:
        ...

    @abstractmethod
    def get_lid_temperature_status(self) -> str:
        ...

    @abstractmethod
    def get_block_temperature(self) -> float:
        ...

    @abstractmethod
    def get_block_target_temperature(self) -> float:
        ...

    @abstractmethod
    def get_lid_temperature(self) -> float:
        ...

    @abstractmethod
    def get_lid_target_temperature(self) -> float:
        ...

    @abstractmethod
    def get_ramp_rate(self) -> float:
        ...

    @abstractmethod
    def get_hold_time(self) -> int:
        ...

    @abstractmethod
    def get_total_cycle_count(self) -> int:
        ...

    @abstractmethod
    def get_current_cycle_index(self) -> int:
        ...

    @abstractmethod
    def get_total_step_count(self) -> int:
        ...

    @abstractmethod
    def get_current_step_index(self) -> int:
        ...
