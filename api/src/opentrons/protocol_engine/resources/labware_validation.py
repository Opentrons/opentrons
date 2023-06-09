"""Validation file for labware role and location checking functions."""

from opentrons_shared_data.labware.labware_definition import LabwareRole
from opentrons.protocols.models import LabwareDefinition


def validate_definition_is_labware(definition: LabwareDefinition) -> bool:
    """Validate that one of the definition's allowed roles is `labware`.

    An empty `allowedRoles` is equivalent to `labware` being the only allowed role.
    """
    return not definition.allowedRoles or LabwareRole.labware in definition.allowedRoles


def validate_definition_is_adapter(definition: LabwareDefinition) -> bool:
    """Validate that one of the definition's allowed roles is `adapter`."""
    return LabwareRole.adapter in definition.allowedRoles
