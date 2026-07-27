"""Page object exports."""

from automation.base_page import BasePage

from .create_protocol_wizard import CreateProtocolWizard
from .deck_config_page import DeckConfigPage
from .heater_shaker_step_form_page import HeaterShakerStepPage
from .landing_page import LandingPage
from .magnetic_module_step_form_page import AddMagneticModule
from .mix_step_form import MixStepForm
from .module_config_page import ModuleConfigPage
from .partial_96ch import Partial96chScenario
from .pipette_modal import PipetteModal
from .protocol_editor_page import ProtocolEditorPage
from .settings_page import SettingsPage
from .tc_step_form_page import ThermocyclerStepPage
from .tempdeck_step_form_page import TemperatureStepPage
from .timeline import Timeline
from .transfer_form import TransferPage, TransferStepConfig, add_transfer_step

__all__ = [
    "BasePage",
    "CreateProtocolWizard",
    "DeckConfigPage",
    "LandingPage",
    "MixStepForm",
    "ModuleConfigPage",
    "Partial96chScenario",
    "PipetteModal",
    "ProtocolEditorPage",
    "SettingsPage",
    "ThermocyclerStepPage",
    "TemperatureStepPage",
    "HeaterShakerStepPage",
    "TransferPage",
    "TransferStepConfig",
    "add_transfer_step",
    "Timeline",
    "AddMagneticModule",
]
