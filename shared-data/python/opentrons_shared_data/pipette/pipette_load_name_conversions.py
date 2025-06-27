from typing import Union
from opentrons_shared_data.errors.exceptions import (
    InvalidInstrumentData,
)
from .types import PipetteModel, PipetteName
from .load_data import (
    load_family_definition_from_internal_model,
    load_family_definition_from_api_name,
    max_version_for_family,
)


from .types import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
)
from .pipette_definition import (
    PipetteNameType,
    PipetteModelVersionType,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]
DEFAULT_MODEL = PipetteModelType.p1000

PIPETTE_AVAILABLE_TYPES = [m.name for m in PipetteModelType]
PIPETTE_CHANNELS_INTS = [c.value for c in PipetteChannelType]


def supported_pipette(model_or_name: Union[PipetteName, PipetteModel, None]) -> bool:
    """Determine if a pipette type is supported.

    Args:
        model_or_name (Union[PipetteName, PipetteModel, None]): The pipette we want to check.

    Returns:
        bool: Whether or not the given pipette name or model is supported.
    """
    if not model_or_name:
        return False
    try:
        load_family_definition_from_internal_model(model_or_name)
    except InvalidInstrumentData:
        try:
            load_family_definition_from_api_name(model_or_name)
        except InvalidInstrumentData:
            return False
    return True


def version_from_string(version: str) -> PipetteVersionType:
    """Convert a version string to a py:obj:PipetteVersionType.

    The version string will either be in the format of `int.int` or `vint.int`.

    Args:
        version (str): The string version we wish to convert.

    Returns:
        PipetteVersionType: A pipette version object.

    """
    return PipetteVersionType.convert_from_string(version)


def convert_to_pipette_name_type(
    model_or_name: PipetteName | PipetteModel | None,
) -> PipetteNameType:
    """Convert the py:data:PipetteName to a py:obj:PipetteModelVersionType.

    `PipetteNames` are in the format of "p300_single" or "p300_single_gen1".

    Args:
        name (PipetteName): The pipette name we want to convert.

    Returns:
        PipetteNameType: An object representing a broken out PipetteName
        string.

    """
    if not model_or_name:
        raise InvalidInstrumentData(f"Invalid pipette model or name: {model_or_name}")
    try:
        family = load_family_definition_from_internal_model(model_or_name)
    except InvalidInstrumentData:
        try:
            family = load_family_definition_from_api_name(model_or_name)
        except InvalidInstrumentData:
            raise
    return PipetteNameType.from_family(family)


def convert_pipette_name(
    name: PipetteName, provided_version: str | None = None
) -> PipetteModelVersionType:
    """Convert the py:data:PipetteName to a py:obj:PipetteModelVersionType.

    `PipetteNames` are in the format of "p300_single" or "p300_single_gen1".

    Args:
        name (PipetteName): The pipette name we want to convert.

    Returns:
        PipetteModelVersionType: An object representing a broken out PipetteName
        string.

    """
    family = load_family_definition_from_api_name(name)
    return PipetteModelVersionType(
        family.model,
        family.channels,
        PipetteVersionType.convert_from_string(provided_version)
        if provided_version is not None
        else max_version_for_family(family),
        family.oem_type,
    )


def convert_pipette_model(
    model: PipetteModel | None, provided_version: str | None = None
) -> PipetteModelVersionType:
    """Convert the py:data:PipetteModel to a py:obj:PipetteModelVersionType.

    `PipetteModel` are in the format of "p300_single_v1.0" or "p300_single_v3.3".

    Sometimes, models may not have a version, in which case the `provided_version` arg
    allows you to specify a version to search for.

    Args:
        model (PipetteModel): The pipette model we want to convert.
        provided_version (str, Optional): The provided version we'd like to look for.

    Returns:
        PipetteModelVersionType: An object representing a broken out PipetteName
        string.

    """
    # TODO (lc 12-5-2022) This helper function is needed
    # until we stop using "name" and "model" to refer
    # to attached pipettes.
    # We need to figure out how to default the pipette model as well
    # rather than returning a p1000
    checked_model = model or DEFAULT_MODEL.value
    family = load_family_definition_from_internal_model(checked_model)
    return PipetteModelVersionType(
        family.model,
        family.channels,
        PipetteVersionType.convert_from_string(provided_version)
        if provided_version is not None
        else family.exemplar_version,
        family.oem_type,
    )
