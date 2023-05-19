from pydantic import ValidationError, BaseModel
from opentrons import config

from .. import file_operators as io, helpers, types as local_types

from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.util.helpers import utc_now

# TODO(lc 09-19-2022) We need to refactor the calibration endpoints
# so that we only need to use one data model schema. This model is a
# temporary workaround to match with current behavior.
class TipLengthCalibration(BaseModel):
    pipette: str = Field(..., description="Pipette id associated with calibration.")
    tiprack: str = Field(
        ..., description="The tiprack hash associated with this tip length data."
    )
    tipLength: float = Field(..., description="Tip length data found from calibration.")
    lastModified: datetime = Field(
        ..., description="The last time this tip length was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )
    uri: typing.Union[LabwareUri, Literal[""]] = Field(
        ..., description="The tiprack URI associated with the tip length data."
    )

    @validator("tipLength")
    def ensure_tip_length_positive(cls, tipLength: float) -> float:
        if tipLength < 0.0:
            raise ValueError("Tip Length must be a positive number")
        return tipLength

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class TipLengthCalibrationHandlerProvider(Generic[RobotType]):
    def __init__(self):
        self._robot_type = 'OT-2'
        self._model_version = "1.0.0"
    
    def load_tip_length_calibration(self, pipette_id: str, definition: "LabwareDefinition") -> v1.TipLengthModel:
        """
        Function used to grab the current tip length associated
        with a particular tiprack.

        :param pipette_id: pipette you are using
        :param definition: full definition of the tiprack
        """
        labware_hash = helpers.hash_labware_def(definition)
        load_name = definition["parameters"]["loadName"]
        try:
            return tip_lengths_for_pipette(pipette_id)[labware_hash]
        except KeyError as e:
            raise local_types.TipLengthCalNotFound(
                f"Tip length of {load_name} has not been "
                f"calibrated for this pipette: {pipette_id} and cannot"
                "be loaded"
            ) from e

    def get_all_tip_length_calibrations(self) -> typing.List[v1.TipLengthCalibration]:
        """
        A helper function that will list all of the tip length calibrations.

        :return: A list of dictionary objects representing all of the
        tip length calibration files found on the robot.
        """
        all_tip_lengths_available = []
        tip_length_dir_path = config.get_tip_length_cal_path()
        for filepath in tip_length_dir_path.glob("**/*.json"):
            if filepath.stem == "index":
                continue
            tip_lengths = tip_lengths_for_pipette(filepath.stem)
            for tiprack_hash, tip_length in tip_lengths.items():
                all_tip_lengths_available.append(
                    v1.TipLengthCalibration(
                        pipette=filepath.stem,
                        tiprack=tiprack_hash,
                        tipLength=tip_length.tipLength,
                        lastModified=tip_length.lastModified,
                        source=tip_length.source,
                        status=tip_length.status,
                        uri=tip_length.uri,
                    )
                )
        return all_tip_lengths_available

    def get_custom_tiprack_definition_for_tlc(self):
        """
        Return the custom tiprack definition saved in the custom tiprack directory
        during tip length calibration
        """
        custom_tiprack_dir = config.get_custom_tiprack_def_path()
        custom_tiprack_path = custom_tiprack_dir / f"{labware_uri}.json"
        try:
            with open(custom_tiprack_path, "rb") as f:
                return typing.cast(
                    "LabwareDefinition",
                    json.loads(f.read().decode("utf-8")),
                )
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Custom tiprack {labware_uri} not found in the custom tiprack"
                "directory on the robot. Please recalibrate tip length and "
                "pipette offset with this tiprack before performing calibration "
                "health check."
            )
    
    def delete_tip_length_calibration(self, tiprack: str, pipette_id: str) -> None:
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
            tip_length_dir = config.get_tip_length_cal_path()
            if tip_lengths:
                dict_of_tip_lengths = _conver_tip_length_model_to_dict(tip_lengths)
                io.save_to_file(tip_length_dir, pipette_id, dict_of_tip_lengths)
            else:
                io.delete_file(tip_length_dir / f"{pipette_id}.json")
        else:
            raise local_types.TipLengthCalNotFound(
                f"Tip length for hash {tiprack} has not been "
                f"calibrated for this pipette: {pipette_id} and cannot"
                "be loaded"
            )

    def clear_tip_length_calibration(self):
        """
        Delete all tip length calibration files.
        """
        offset_dir = config.get_tip_length_cal_path()
        try:
            io._remove_json_files_in_directories(offset_dir)
        except FileNotFoundError:
            pass

    def create_tip_length_data(self):
        """
        Function to correctly format tip length data.

        :param definition: full labware definition
        :param length: the tip length to save
        """
        labware_hash = helpers.hash_labware_def(definition)
        labware_uri = helpers.uri_from_definition(definition)

        if isinstance(cal_status, local_types.CalibrationStatus):
            cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
        elif isinstance(cal_status, v1.CalibrationStatus):
            cal_status_model = cal_status
        else:
            cal_status_model = v1.CalibrationStatus()
        tip_length_data = v1.TipLengthModel(
            tipLength=length,
            lastModified=utc_now(),
            source=local_types.SourceType.user,
            status=cal_status_model,
            uri=labware_uri,
        )

        if not definition.get("namespace") == OPENTRONS_NAMESPACE:
            _save_custom_tiprack_definition(labware_uri, definition)

        data = {labware_hash: tip_length_data}
        return data
    
    def save_tip_length_calibration(self, pip_id: str, tip_length_cal: typing.Dict[str, v1.TipLengthModel]) -> None:
        """
        Function used to save tip length calibration to file.

        :param pip_id: pipette id to associate with this tip length
        :param tip_length_cal: results of the data created using
            :meth:`create_tip_length_data`
        """
        tip_length_dir_path = config.get_tip_length_cal_path()

        all_tip_lengths = tip_lengths_for_pipette(pip_id)

        all_tip_lengths.update(tip_length_cal)

        dict_of_tip_lengths = _conver_tip_length_model_to_dict(all_tip_lengths)
        io.save_to_file(tip_length_dir_path, pip_id, dict_of_tip_lengths)
