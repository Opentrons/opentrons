import logging
from typing import Optional, Any

from opentrons import types
from opentrons.calibration_storage import get
from opentrons.calibration_storage.types import TipLengthCalNotFound
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_api.labware import Labware, Well
from opentrons.protocols.api_support.types import APIVersion
from opentrons_shared_data.protocol.dev_types import (
    LiquidHandlingCommand,
    BlowoutLocation,
)


def validate_blowout_location(
    api_version: APIVersion,
    liquid_handling_command: LiquidHandlingCommand,
    blowout_location: Optional[Any],
) -> None:
    """Validate the blowout location."""
    if blowout_location and api_version < APIVersion(2, 8):
        raise ValueError(
            "Cannot specify blowout location when using api"
            + " version below 2.8, current version is {api_version}".format(
                api_version=api_version
            )
        )

    elif liquid_handling_command == "consolidate" and blowout_location == "source well":
        raise ValueError("blowout location for consolidate cannot be source well")
    elif (
        liquid_handling_command == "distribute"
        and blowout_location == "destination well"
    ):
        raise ValueError("blowout location for distribute cannot be destination well")
    elif (
        liquid_handling_command == "transfer"
        and blowout_location
        and blowout_location not in [location.value for location in BlowoutLocation]
    ):
        raise ValueError(
            "blowout location should be either 'source well', "
            + " 'destination well', or 'trash'"
            + f" but it is {blowout_location}"
        )


def tip_length_for(pipette: PipetteDict, tiprack: Labware) -> float:
    """Get the tip length, including overlap, for a tip from this rack"""

    def _build_length_from_overlap() -> float:
        tip_overlap = pipette["tip_overlap"].get(
            tiprack.uri, pipette["tip_overlap"]["default"]
        )
        tip_length = tiprack.tip_length
        return tip_length - tip_overlap

    try:
        return get.load_tip_length_calibration(
            pipette["pipette_id"], tiprack._implementation.get_definition()
        ).tip_length
    except TipLengthCalNotFound:
        return _build_length_from_overlap()


VALID_PIP_TIPRACK_VOL = {
    "p10": [10, 20],
    "p20": [10, 20],
    "p50": [200, 300],
    "p300": [200, 300],
    "p1000": [1000],
}


def validate_tiprack(
    instrument_name: str, tiprack: Labware, log: logging.Logger
) -> None:
    """Validate a tiprack logging a warning message."""
    # TODO AA 2020-06-24 - we should instead add the acceptable Opentrons
    #  tipracks to the pipette as a refactor
    if tiprack._implementation.get_definition()["namespace"] == "opentrons":
        tiprack_vol = tiprack.wells()[0].max_volume
        valid_vols = VALID_PIP_TIPRACK_VOL[instrument_name.split("_")[0]]
        if tiprack_vol not in valid_vols:
            log.warning(
                f"The pipette {instrument_name} and its tiprack "
                f"{tiprack.load_name} in slot {tiprack.parent} appear to "
                "be mismatched. Please check your protocol before running "
                "on the robot."
            )


def determine_drop_target(
    api_version: APIVersion,
    location: Well,
    return_height: float,
    version_breakpoint: APIVersion = None,
) -> types.Location:
    """Determine the drop target based on well and api version."""
    version_breakpoint = version_breakpoint or APIVersion(2, 2)
    if api_version < version_breakpoint:
        bot = location.bottom()
        return types.Location(
            point=bot.point._replace(z=bot.point.z + 10), labware=location
        )
    else:
        tr = location.parent
        assert tr.is_tiprack
        z_height = return_height * tr.tip_length
        return location.top(-z_height)


def validate_takes_liquid(location: types.Location, reject_module: bool) -> None:
    """Validate that a location is a valid liquid handling target.

    Args:
        location: target location.

    Raises:
        ValueError: the given location is not a valid liquid handling target.
    """
    labware = None

    if location.labware.is_labware:
        labware = location.labware.as_labware()

    if location.labware.is_well:
        labware = location.labware.as_well().parent

    if location.labware.is_module and reject_module:
        raise ValueError("Cannot aspirate/dispense directly to a module")

    if labware is not None and labware.is_tiprack:
        raise ValueError("Cannot aspirate/dispense to a tip rack")
