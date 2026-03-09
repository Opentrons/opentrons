"""Labware origin math errors."""

from typing import Any, Dict, Optional, Sequence

from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.errors.exceptions import EnumeratedError

from opentrons.protocol_engine.errors import ProtocolEngineError


class LabwareLocatingFeatureError(ProtocolEngineError):
    """Base class for errors related to labware locating features."""

    def __init__(
        self,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a LabwareLocatingFeatureError."""
        super().__init__(
            ErrorCodes.LABWARE_LOCATING_FEATURE_ERROR, message, details, wrapping
        )


class MissingLocatingFeatureError(LabwareLocatingFeatureError):
    """Raised when a labware definition is missing a required locating feature."""

    def __init__(
        self,
        labware_name: str,
        required_feature: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a MissingLocatingFeatureError."""
        if message is None:
            message = f"Expected {labware_name} to have {required_feature} feature"

        if details is None:
            details = {
                "labware_name": labware_name,
                "required_feature": required_feature,
            }

        super().__init__(message, details, wrapping)


class InvalidLabwarePlacementError(LabwareLocatingFeatureError):
    """Raised when a labware cannot be placed in the specified location due to locating feature constraints."""

    def __init__(
        self,
        feature_name: str,
        invalid_placement: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an InvalidLabwarePlacementError."""
        if message is None:
            message = f"{feature_name} feature does not support placement: {invalid_placement}"

        if details is None:
            details = {
                "feature_name": feature_name,
                "invalid_placement": invalid_placement,
            }

        super().__init__(message, details, wrapping)


class IncompatibleLocatingFeatureError(LabwareLocatingFeatureError):
    """Raised when parent and child labware have incompatible locating features."""

    def __init__(
        self,
        parent_feature: str,
        child_feature: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an IncompatibleLocatingFeatureError."""
        if message is None:
            message = f"Incompatible labware features: parent {parent_feature}, child {child_feature}"

        if details is None:
            details = {
                "parent_feature": parent_feature,
                "child_feature": child_feature,
            }

        super().__init__(message, details, wrapping)
