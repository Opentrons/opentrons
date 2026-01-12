"""Camera related state and store resource.

Camera settings, particularly for enablement, can be quieried from via the Camera Provider callback.
However, here Camera settings may also be provided to override or supercede those provided by the callbacks.
"""

from dataclasses import dataclass
from typing import Optional, Tuple

from ..actions import Action
from ._abstract_store import HandlesActions, HasState
from opentrons.protocol_engine.actions import (
    AddCameraCaptureImageSettingsAction,
    AddCameraSettingsAction,
)
from opentrons.protocol_engine.resources.camera_provider import CameraSettings


@dataclass
class CameraState:
    """State of Engine Camera override settings."""

    enablement_settings: Optional[CameraSettings]
    camera_id: Optional[str]
    resolution: Optional[Tuple[int, int]]
    zoom: Optional[float]
    pan: Optional[Tuple[int, int]]
    contrast: Optional[float]
    brightness: Optional[float]
    saturation: Optional[float]


class CameraStore(HasState[CameraState], HandlesActions):
    """Camera container."""

    _state: CameraState

    def __init__(self) -> None:
        """Initialize a Camera store and its state."""
        self._state = CameraState(
            enablement_settings=None,
            camera_id=None,
            resolution=None,
            zoom=None,
            pan=None,
            contrast=None,
            brightness=None,
            saturation=None,
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, AddCameraSettingsAction):
            # Update the Camera Enablement settings to the newest override settings
            self._state.enablement_settings = action.enablement_settings
        if isinstance(action, AddCameraCaptureImageSettingsAction):
            # Update the Camera capture image settings to the newest run specific settings
            self._state.camera_id = (
                action.camera_id
                if action.camera_id is not None
                else self._state.camera_id
            )
            self._state.resolution = (
                action.resolution
                if action.resolution is not None
                else self._state.resolution
            )
            self._state.zoom = (
                action.zoom if action.zoom is not None else self._state.zoom
            )
            self._state.pan = action.pan if action.pan is not None else self._state.pan
            self._state.contrast = (
                action.contrast if action.contrast is not None else self._state.contrast
            )
            self._state.brightness = (
                action.brightness
                if action.brightness is not None
                else self._state.brightness
            )
            self._state.saturation = (
                action.saturation
                if action.saturation is not None
                else self._state.saturation
            )


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

    def get_camera_id(self) -> str | None:
        """Get the id of the camera set as the default for this run. None means we will use the system default."""
        return self._state.camera_id

    def get_resolution(self) -> Tuple[int, int] | None:
        """Get the resolution set as the default for this run. None means we will use the system default."""
        return self._state.resolution

    def get_zoom(self) -> float | None:
        """Get the resolution set as the default for this run. None means we will use the system default."""
        return self._state.zoom

    def get_pan(self) -> Tuple[int, int] | None:
        """Get the pan values set as the default for this run. None means we will use the system default."""
        return self._state.pan

    def get_contrast(self) -> float | None:
        """Get the contrast set as the default for this run. None means we will use the system default."""
        return self._state.contrast

    def get_brightness(self) -> float | None:
        """Get the brightness set as the default for this run. None means we will use the system default."""
        return self._state.brightness

    def get_saturation(self) -> float | None:
        """Get the saturation set as the default for this run. None means we will use the system default."""
        return self._state.saturation
