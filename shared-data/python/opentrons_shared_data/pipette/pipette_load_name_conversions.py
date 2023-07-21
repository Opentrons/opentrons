import re
from typing import List, Optional, Union, cast
from dataclasses import dataclass
from .dev_types import PipetteModel, PipetteName
from .pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteGenerationType,
    PIPETTE_AVAILABLE_TYPES,
    PIPETTE_CHANNELS_INTS,
    PipetteModelMajorVersionType,
    PipetteModelMinorVersionType,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]
DEFAULT_MODEL = PipetteModelType.p1000
DEFAULT_CHANNELS = PipetteChannelType.SINGLE_CHANNEL
DEFAULT_MODEL_VERSION = PipetteVersionType(major=1, minor=0)


# TODO (lc 12-5-2022) Ideally we can deprecate this
# at somepoint once we load pipettes by channels and type
@dataclass
class PipetteNameType:
    pipette_type: PipetteModelType
    pipette_channels: PipetteChannelType
    pipette_generation: PipetteGenerationType

    def __repr__(self) -> str:
        base_name = f"{self.pipette_type.name}_{self.pipette_channels}"
        if self.pipette_generation == PipetteGenerationType.GEN1:
            return base_name
        elif self.pipette_channels == PipetteChannelType.NINETY_SIX_CHANNEL:
            return base_name
        else:
            return f"{base_name}_{self.pipette_generation.name.lower()}"


@dataclass
class PipetteModelVersionType:
    pipette_type: PipetteModelType
    pipette_channels: PipetteChannelType
    pipette_version: PipetteVersionType

    def __repr__(self) -> str:
        base_name = f"{self.pipette_type.name}_{self.pipette_channels}"

        return f"{base_name}_v{self.pipette_version}"


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
    channels_as_int = channels_from_string(split_model_or_name[1]).as_int
    if (
        split_model_or_name[0] in PIPETTE_AVAILABLE_TYPES
        or channels_as_int in PIPETTE_CHANNELS_INTS
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
    else:
        return PipetteChannelType.SINGLE_CHANNEL


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
    minor = cast(PipetteModelMinorVersionType, int(version_list[1]))
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


def convert_to_pipette_name_type(name: PipetteName) -> PipetteNameType:
    """Convert the py:data:PipetteName to a py:obj:PipetteModelVersionType.

    `PipetteNames` are in the format of "p300_single" or "p300_single_gen1".

    Args:
        name (PipetteName): The pipette name we want to convert.

    Returns:
        PipetteNameType: An object representing a broken out PipetteName
        string.

    """
    split_pipette_name = name.split("_")
    channels = channels_from_string(split_pipette_name[1])
    generation = generation_from_string(split_pipette_name)
    pipette_type = PipetteModelType[split_pipette_name[0]]

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
