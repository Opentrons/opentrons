import os
import json
import typing
from pydantic import ValidationError
from dataclasses import asdict

from opentrons import config

from .. import file_operators as io, helpers, types as local_types

from opentrons.util.helpers import utc_now


from .schemas import v1

if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition


TipLengthCalibrations = typing.Dict[
    local_types.PipetteId, typing.Dict[local_types.TiprackHash, v1.TipLengthSchema]
]


# Tip Length Calibrations Look-Up


def _tip_length_calibrations() -> TipLengthCalibrations:
    tip_length_dir = config.get_tip_length_cal_path()
    tip_length_calibrations: TipLengthCalibrations = {}
    for file in os.scandir(tip_length_dir):
        if file.name == "index.json":
            continue
        if file.is_file() and ".json" in file.name:
            pipette_id = typing.cast(local_types.PipetteId, file.name.split(".json")[0])
            tip_length_calibrations[pipette_id] = {}
            all_tip_lengths_for_pipette = io.read_cal_file(file.path)
            for tiprack, data in all_tip_lengths_for_pipette.items():
                try:
                    tip_length_calibrations[pipette_id][
                        typing.cast(local_types.TiprackHash, tiprack)
                    ] = v1.TipLengthSchema(**data)
                except (json.JSONDecodeError, ValidationError):
                    pass
    return tip_length_calibrations


def _tip_lengths_for_pipette(
    pipette_id: local_types.PipetteId,
) -> typing.Dict[local_types.TiprackHash, v1.TipLengthSchema]:
    try:
        return _tip_length_calibrations()[pipette_id]
    except KeyError:
        return {}


# Delete Tip Length Calibration


def delete_tip_length_calibration(
    tiprack: local_types.TiprackHash, pipette_id: local_types.PipetteId
) -> None:
    """
    Delete tip length calibration based on tiprack hash and
    pipette serial number

    :param tiprack: tiprack hash
    :param pipette: pipette serial number
    """
    tip_lengths_for_pipette = _tip_lengths_for_pipette(pipette_id)
    if tiprack in tip_lengths_for_pipette:
        # maybe make modify and delete same file?
        del tip_lengths_for_pipette[tiprack]
        tip_length_path = config.get_tip_length_cal_path() / f"{pipette_id}.json"
        if tip_lengths_for_pipette:
            io.save_to_file(tip_length_path, tip_lengths_for_pipette)
        else:
            tip_length_path.unlink()
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
    pip_id: local_types.PipetteId,
    tip_length_cal: typing.Dict[local_types.TiprackHash, v1.TipLengthSchema],
) -> None:
    """
    Function used to save tip length calibration to file.

    :param pip_id: pipette id to associate with this tip length
    :param tip_length_cal: results of the data created using
           :meth:`create_tip_length_data`
    """
    tip_length_dir_path = config.get_tip_length_cal_path()
    tip_length_dir_path.mkdir(parents=True, exist_ok=True)
    pip_tip_length_path = tip_length_dir_path / f"{pip_id}.json"

    all_tip_lengths = _tip_lengths_for_pipette(pip_id)

    all_tip_lengths.update(tip_length_cal)

    # This is a workaround since pydantic doesn't have a nice way to
    # add encoders when converting to a dict.
    dict_of_tip_lengths = {}
    for key, item in all_tip_lengths.items():
        dict_of_tip_lengths[key] = json.loads(item.json())
    io.save_to_file(pip_tip_length_path, dict_of_tip_lengths)


# Get Tip Length Calibration


def load_tip_length_calibration(
    pip_id: local_types.PipetteId, definition: "LabwareDefinition"
) -> v1.TipLengthSchema:
    """
    Function used to grab the current tip length associated
    with a particular tiprack.

    :param pip_id: pipette you are using
    :param definition: full definition of the tiprack
    """
    labware_hash = helpers.hash_labware_def(definition)
    load_name = definition["parameters"]["loadName"]
    try:
        return _tip_length_calibrations()[pip_id][labware_hash]
    except KeyError:
        raise local_types.TipLengthCalNotFound(
            f"Tip length of {load_name} has not been "
            f"calibrated for this pipette: {pip_id} and cannot"
            "be loaded"
        )


def create_tip_length_data(
    definition: "LabwareDefinition",
    length: float,
    cal_status: typing.Optional[local_types.CalibrationStatus] = None,
) -> typing.Dict[local_types.TiprackHash, v1.TipLengthSchema]:
    """
    Function to correctly format tip length data.

    :param definition: full labware definition
    :param length: the tip length to save
    """
    labware_hash = helpers.hash_labware_def(definition)
    labware_uri = helpers.uri_from_definition(definition)

    if cal_status:
        cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
    else:
        cal_status_model = v1.CalibrationStatus()
    tip_length_data = v1.TipLengthSchema(
        tipLength=length,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status_model,
        uri=labware_uri,
    )

    data = {labware_hash: tip_length_data}
    return data
