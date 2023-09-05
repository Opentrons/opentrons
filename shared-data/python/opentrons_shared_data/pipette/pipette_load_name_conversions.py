import re
from typing import List, Optional, Union, cast
from .dev_types import PipetteModel, PipetteName
from .types import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteGenerationType,
    PipetteModelMajorVersionType,
    PipetteModelMinorVersionType,
)
from .pipette_definition import (
    PipetteNameType,
    PipetteModelVersionType,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]
DEFAULT_MODEL = PipetteModelType.p1000
DEFAULT_CHANNELS = PipetteChannelType.SINGLE_CHANNEL
DEFAULT_MODEL_VERSION = PipetteVersionType(major=1, minor=0)

PIPETTE_AVAILABLE_TYPES = [m.name for m in PipetteModelType]
PIPETTE_CHANNELS_INTS = [c.value for c in PipetteChannelType]


def is_model(model_or_name: Union[PipetteName, PipetteModel, None]) -> bool:
    """Determine if we have a real model or just a PipetteName.

    Args:
        model_or_name (Union[PipetteName, PipetteModel, None]): The pipette we want to check.

    Returns:
        bool: Whether or not the given string is a PipetteModel
    """
    if not model_or_name:
        return False
    return "v" in model_or_name


def supported_pipette(model_or_name: Union[PipetteName, PipetteModel, None]) -> bool:
    """Determine if a pipette type is supported.

    Args:
        model_or_name (Union[PipetteName, PipetteModel, None]): The pipette we want to check.

    Returns:
        bool: Whether or not the given pipette name or model is supported.
    """
    if not model_or_name:
        return False
    split_model_or_name = model_or_name.split("_")
    try:
        channels_as_int = int(channels_from_string(split_model_or_name[1]))
    except ValueError:
        channels_as_int = 0
    if (
        split_model_or_name[0] in PIPETTE_AVAILABLE_TYPES
        and channels_as_int in PIPETTE_CHANNELS_INTS
    ):
        return True
    return False


def channels_from_string(channels: str) -> PipetteChannelType:
    """Convert channels from a string.

    With both `py:data:PipetteName` and `py:data:PipetteObject`, we refer to channel types
    as `single`, `multi` or `96`.

    Args:
        channels (str): The channel string we wish to convert.

    Returns:
        PipetteChannelType: A `py:obj:PipetteChannelType`
        representing the number of channels on a pipette.

    """
    if channels == "96":
        return PipetteChannelType.NINETY_SIX_CHANNEL
    elif channels == "multi":
        return PipetteChannelType.EIGHT_CHANNEL
    elif channels == "single":
        return PipetteChannelType.SINGLE_CHANNEL
    else:
        raise ValueError("Invalid number of channels")


def version_from_string(version: str) -> PipetteVersionType:
    """Convert a version string to a py:obj:PipetteVersionType.

    The version string will either be in the format of `int.int` or `vint.int`.

    Args:
        version (str): The string version we wish to convert.

    Returns:
        PipetteVersionType: A pipette version object.

    """
    version_list = [v for v in re.split("\\.|[v]", version) if v]
    major = cast(PipetteModelMajorVersionType, int(version_list[0]))
    if len(version_list) > 1:
        minor = cast(PipetteModelMinorVersionType, int(version_list[1]))
    else:
        minor = 0
    return PipetteVersionType(major, minor)


def version_from_generation(pipette_name_list: List[str]) -> PipetteVersionType:
    """Convert a string generation name to a py:obj:PipetteVersionType.

    Pipette generations are strings in the format of "gen1" or "gen2", and
    usually associated withe :py:data:PipetteName.

    Args:
        pipette_name_list (List[str]): A list of strings from the separated by `_`
        py:data:PipetteName.

    Returns:
        PipetteVersionType: A pipette version object.

    """
    if "flex" in pipette_name_list or "gen3" in pipette_name_list:
        return PipetteVersionType(3, 0)
    elif "gen2" in pipette_name_list:
        return PipetteVersionType(2, 0)
    else:
        return PipetteVersionType(1, 0)


def generation_from_string(pipette_name_list: List[str]) -> PipetteGenerationType:
    """Convert a string generation name to a py:obj:PipetteGenerationType.

    Args:
        pipette_name_list (List[str]): A list of strings from the separated by `_`
        py:data:PipetteName or py:data:PipetteModel.

    Returns:
        PipetteGenerationType: A pipette version object.

    """
    if "flex" in pipette_name_list or "3." in pipette_name_list[-1]:
        return PipetteGenerationType.FLEX
    elif "gen2" in pipette_name_list or "2." in pipette_name_list[-1]:
        return PipetteGenerationType.GEN2
    else:
        return PipetteGenerationType.GEN1


def convert_to_pipette_name_type(
    model_or_name: Union[PipetteName, PipetteModel]
) -> PipetteNameType:
    """Convert the py:data:PipetteName to a py:obj:PipetteModelVersionType.

    `PipetteNames` are in the format of "p300_single" or "p300_single_gen1".

    Args:
        name (PipetteName): The pipette name we want to convert.

    Returns:
        PipetteNameType: An object representing a broken out PipetteName
        string.

    """
    split_pipette_model_or_name = model_or_name.split("_")
    channels = channels_from_string(split_pipette_model_or_name[1])
    generation = generation_from_string(split_pipette_model_or_name)
    pipette_type = PipetteModelType[split_pipette_model_or_name[0]]

    return PipetteNameType(pipette_type, channels, generation)


def convert_pipette_name(
    name: PipetteName, provided_version: Optional[str] = None
) -> PipetteModelVersionType:
    """Convert the py:data:PipetteName to a py:obj:PipetteModelVersionType.

    `PipetteNames` are in the format of "p300_single" or "p300_single_gen1".

    Args:
        name (PipetteName): The pipette name we want to convert.

    Returns:
        PipetteModelVersionType: An object representing a broken out PipetteName
        string.

    """
    split_pipette_name = name.split("_")
    channels = channels_from_string(split_pipette_name[1])
    if provided_version:
        version = version_from_string(provided_version)
    else:
        version = version_from_generation(split_pipette_name)

    pipette_type = PipetteModelType[split_pipette_name[0]]

    return PipetteModelVersionType(pipette_type, channels, version)


def convert_pipette_model(
    model: Optional[PipetteModel], provided_version: Optional[str] = ""
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
    if model and not provided_version:
        pipette_type, parsed_channels, parsed_version = model.split("_")
        channels = channels_from_string(parsed_channels)
        version = version_from_string(parsed_version)
    elif model and provided_version:
        pipette_type, parsed_channels = model.split("_")
        channels = channels_from_string(parsed_channels)
        version = version_from_string(provided_version)
    else:
        pipette_type = DEFAULT_MODEL.value
        channels = DEFAULT_CHANNELS
        version = DEFAULT_MODEL_VERSION
    return PipetteModelVersionType(PipetteModelType[pipette_type], channels, version)
