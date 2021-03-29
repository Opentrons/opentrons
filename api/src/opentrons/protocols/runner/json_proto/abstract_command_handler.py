from abc import ABC, abstractmethod
from opentrons.protocols.runner.json_proto.models import json_protocol as models


class AbstractCommandHandler(ABC):

    @abstractmethod
    def handle_aspirate(self, command: models.LiquidCommand) -> None:
        ...

    @abstractmethod
    def handle_dispense(self, command: models.LiquidCommand) -> None:
        ...

    @abstractmethod
    def handle_air_gap(self, command: models.LiquidCommand) -> None:
        ...

    @abstractmethod
    def handle_blowout(self, command: models.BlowoutCommand) -> None:
        ...

    @abstractmethod
    def handle_touch_tip(self, command: models.TouchTipCommand) -> None:
        ...

    @abstractmethod
    def handle_pick_up(self, command: models.PickUpDropTipCommand) -> None:
        ...

    @abstractmethod
    def handle_drop_tip(self, command: models.PickUpDropTipCommand) -> None:
        ...

    @abstractmethod
    def handle_move_to_slot(self, command: models.MoveToSlotCommand) -> None:
        ...

    @abstractmethod
    def handle_delay(self, command: models.DelayCommand) -> None:
        ...

    @abstractmethod
    def handle_magnetic_module_engage(
            self, command: models.MagneticModuleEngageCommand) -> None:
        ...

    @abstractmethod
    def handle_magnetic_module_disengage(
            self, command: models.MagneticModuleDisengageCommand) -> None:
        ...

    @abstractmethod
    def handle_temperature_module_set_target(
            self, command: models.TemperatureModuleSetTargetCommand) -> None:
        ...

    @abstractmethod
    def handle_temperature_module_await_temperature(
            self, command: models.TemperatureModuleAwaitTemperatureCommand) -> None:
        ...

    @abstractmethod
    def handle_temperature_module_deactivate(
            self, command: models.TemperatureModuleDeactivateCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_set_target_block_temperature(
            self, command: models.ThermocyclerSetTargetBlockTemperatureCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_set_target_lid_temperature(
            self, command: models.ThermocyclerSetTargetLidTemperatureCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_await_block_temperature(
            self, command: models.ThermocyclerAwaitBlockTemperatureCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_await_lid_temperature(
            self, command: models.ThermocyclerAwaitLidTemperatureCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_deactivate_block(
            self, command: models.ThermocyclerDeactivateBlockCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_deactivate_lid(
            self, command: models.ThermocyclerDeactivateLidCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_open_lid(
            self, command: models.ThermocyclerOpenLidCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_close_lid(
            self, command: models.ThermocyclerCloseLidCommand) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_run_profile(
            self, command: models.ThermocyclerRunProfile) -> None:
        ...

    @abstractmethod
    def handle_thermocycler_await_profile_complete(
            self, command: models.ThermocyclerAwaitProfileCompleteCommand) -> None:
        ...

    @abstractmethod
    def handle_move_to_well(self, command: models.MoveToWellCommand) -> None:
        ...
