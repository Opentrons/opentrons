import json
import typing
import logging
from pydantic import ValidationError

from opentrons import config

from .. import file_operators as io, helpers, types as local_types

from opentrons.util import helpers as util_helpers


from .models import v1

if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition

log = logging.getLogger(__name__)
# Get Tip Length Calibration


def tip_lengths_for_pipette(
    pipette_id: str,
) -> typing.Dict[str, v1.TipLengthModel]:
    tip_lengths = {}
    try:
        tip_length_filepath = config.get_tip_length_cal_path() / f"{pipette_id}.json"
        all_tip_lengths_for_pipette = io.read_cal_file(tip_length_filepath)
        for tiprack, data in all_tip_lengths_for_pipette.items():
            try:
                tip_lengths[tiprack] = v1.TipLengthModel(**data)
            except (json.JSONDecodeError, ValidationError):
                log.warning(
                    f"Tip length calibration is malformed for {tiprack} on {pipette_id}"
                )
                pass
        return tip_lengths
    except FileNotFoundError:
        log.warning(f"Tip length calibrations not found for {pipette_id}")
        return tip_lengths


def load_tip_length_calibration(
    pip_id: str, definition: "LabwareDefinition"
) -> v1.TipLengthModel:
    """
    Function used to grab the current tip length associated
    with a particular tiprack.

    :param pip_id: pipette you are using
    :param definition: full definition of the tiprack
    """
    labware_hash = helpers.hash_labware_def(definition)
    load_name = definition["parameters"]["loadName"]
    try:
        return tip_lengths_for_pipette(pip_id)[labware_hash]
    except KeyError:
        raise local_types.TipLengthCalNotFound(
            f"Tip length of {load_name} has not been "
            f"calibrated for this pipette: {pip_id} and cannot"
            "be loaded"
        )


def create_tip_length_data(
    definition: "LabwareDefinition",
    length: float,
) -> typing.Dict[str, v1.TipLengthModel]:
    """
    Function to correctly format tip length data.

    :param definition: full labware definition
    :param length: the tip length to save
    """
    labware_hash = helpers.hash_labware_def(definition)
    labware_uri = helpers.uri_from_definition(definition)

    tip_length_data = v1.TipLengthModel(
        tipLength=length,
        lastModified=util_helpers.utc_now(),
        source=local_types.SourceType.user,
        status=v1.CalibrationStatus(),
        uri=labware_uri,
    )

    data = {labware_hash: tip_length_data}
    return data


# Delete Tip Length Calibration


def delete_tip_length_calibration(tiprack: str, pipette_id: str) -> None:
    """
    Delete tip length calibration based on tiprack hash and
    pipette serial number

    :param tiprack: tiprack hash
    :param pipette: pipette serial number
    """
    tip_lengths = tip_lengths_for_pipette(pipette_id)
    if tiprack in tip_lengths:
        # maybe make modify and delete same file?
        del tip_lengths[tiprack]
        tip_length_directory = config.get_tip_length_cal_path()
        if tip_lengths:
            io.save_to_file(tip_length_directory, pipette_id, tip_lengths)
        else:
            io.delete_file(tip_length_directory / f"{pipette_id}.json")
    else:
        raise local_types.TipLengthCalNotFound(
            f"Tip length for hash {tiprack} has not been "
            f"calibrated for this pipette: {pipette_id} and cannot"
            "be loaded"
        )


def clear_tip_length_calibration() -> None:
    """
    Delete all tip length calibration files.
    """
    offset_dir = config.get_tip_length_cal_path()
    try:
        io._remove_json_files_in_directories(offset_dir)
    except FileNotFoundError:
        pass


# Save Tip Length Calibration


def save_tip_length_calibration(
    pip_id: str,
    tip_length_cal: typing.Mapping[str, v1.TipLengthModel],
) -> None:
    """
    Function used to save tip length calibration to file.

    :param pip_id: pipette id to associate with this tip length
    :param tip_length_cal: results of the data created using
           :meth:`create_tip_length_data`
    """
    tip_length_dir_path = config.get_tip_length_cal_path()

    all_tip_lengths = tip_lengths_for_pipette(pip_id)

    all_tip_lengths.update(tip_length_cal)

    # This is a workaround since pydantic doesn't have a nice way to
    # add encoders when converting to a dict.
    dict_of_tip_lengths = {}
    for key, item in all_tip_lengths.items():
        dict_of_tip_lengths[key] = json.loads(item.json())
    io.save_to_file(tip_length_dir_path, pip_id, dict_of_tip_lengths)
