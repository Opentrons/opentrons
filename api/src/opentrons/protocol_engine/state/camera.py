"""Camera related state and store resource.

Camera settings, particularly for enablement, can be quieried from via the Camera Provider callback.
However, here Camera settings may also be provided to override or supercede those provided by the callbacks.
"""
from dataclasses import dataclass
from typing import Optional
from opentrons.protocol_engine.actions import AddCameraSettingsAction
from opentrons.protocol_engine.resources.camera_provider import CameraSettings

from ._abstract_store import HasState, HandlesActions
from ..actions import Action


@dataclass
class CameraState:
    """State of Engine Camera override settings."""

    enablement_settings: Optional[CameraSettings]
    # todo(chb, 2025-10-28): Eventually we will want to extend this to include the camera configurations overrides (contrast, zoom, etc)


class CameraStore(HasState[CameraState], HandlesActions):
    """Camera container."""

    _state: CameraState

    def __init__(self) -> None:
        """Initialize a Camera store and its state."""
        self._state = CameraState(enablement_settings=None)

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, AddCameraSettingsAction):
            # Update the Camera Enablement settings to the newest override settings
            self._state.enablement_settings = action.enablement_settings


class CameraView:
    """Read-only engine created Camera state view."""

    _state: CameraState

    def __init__(self, state: CameraState) -> None:
        """Initialize the view of Camera state.

        Arguments:
            state: Camera dataclass used for tracking override settings for the camera.
        """
        self._state = state

    def get_enablement_settings(self) -> CameraSettings | None:
        """Get the enablement settings override currently in use. This will take priority over Camera Provider callback provided settings."""
        return self._state.enablement_settings
