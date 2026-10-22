"""Page object exports."""

from automation.base_page import BasePage

from .create_protocol_wizard import CreateProtocolWizard
from .deck_config_page import DeckConfigPage
from .heater_shaker_step_form_page import HeaterShakerStepPage
from .landing_page import LandingPage
from .magnetic_module_step_form_page import AddMagneticModule
from .mix_step_form import MixStepForm, add_mix_step
from .module_config_page import ModuleConfigPage
from .pipette_modal import PipetteModal
from .protocol_editor_page import ProtocolEditorPage
from .settings_page import SettingsPage
from .tc_step_form_page import ThermocyclerStepPage
from .tempdeck_step_form_page import TemperatureStepPage
from .timeline import Timeline
from .transfer_form import TransferPage, TransferStepConfig, add_transfer_step, add_transfer_steps
from .vacuum_step_form_page import (VacuumProfileCycleConfig, VacuumProfileStepConfig, VacuumStepPage, add_vacuum_close_vent, add_vacuum_open_vent, add_vacuum_power_state, add_vacuum_pressure_profile, add_vacuum_pressure_state, add_vacuum_pump_off)

__all__ = [
    "BasePage",
    "CreateProtocolWizard",
    "DeckConfigPage",
    "LandingPage",
    "MixStepForm",
    "ModuleConfigPage",
    "PipetteModal",
    "ProtocolEditorPage",
    "SettingsPage",
    "ThermocyclerStepPage",
    "TemperatureStepPage",
    "HeaterShakerStepPage",
    "TransferPage",
    "TransferStepConfig",
    "VacuumStepPage",
    "VacuumProfileCycleConfig",
    "VacuumProfileStepConfig",
    "add_mix_step",
    "add_transfer_step",
    "add_transfer_steps",
    "add_vacuum_close_vent",
    "add_vacuum_open_vent",
    "add_vacuum_power_state",
    "add_vacuum_pressure_profile",
    "add_vacuum_pressure_state",
    "add_vacuum_pump_off",
    "Timeline",
    "AddMagneticModule",
]
