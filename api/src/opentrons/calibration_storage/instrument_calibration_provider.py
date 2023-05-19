import json
from pydantic import ValidationError, BaseModel
from typing import overload, Optional

from opentrons import types as opentrons_types, config
from opentrons.hardware_control import types as hc_types

from . import file_operators as io
# TODO we should make the instrument methods a little more generic


class InstrumentOffsetModel(BaseModel):
    offset: Point = Field(..., description="Instrument offset found from calibration.")
    tiprack: str = Field(..., description="Tiprack used to calibrate this offset")
    uri: str = Field(
        ..., description="The URI of the labware used for instrument offset"
    )
    last_modified: datetime = Field(
        ..., description="The last time this instrument was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


# TODO(lc 09-19-2022) We need to refactor the calibration endpoints
# so that we only need to use one data model schema. This model is a
# temporary workaround to match with current behavior.
class PipetteOffsetCalibration(BaseModel):
    pipette: str = Field(..., description="Pipette id associated with calibration.")
    mount: str = Field(
        ..., description="The mount that this pipette was calibrated with."
    )
    offset: Point = Field(..., description="Instrument offset found from calibration.")
    tiprack: str = Field(..., description="Tiprack used to calibrate this offset")
    uri: str = Field(
        ..., description="The URI of the labware used for instrument offset"
    )
    last_modified: datetime = Field(
        ..., description="The last time this instrument was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class InstrumentCalibrationHandlerProvider(Generic[RobotType]):
    def __init__(self) -> None:
        self._robot_type = 'OT-2'
        self._model_version = "1.0.0"
    
    @overload
    def delete_instrument_offset_file(self, instrument_id: str, mount: opentrons_types.Mount) -> None:
        ...

    @overload
    def delete_instrument_offset_file(self, instrument_id: str, mount: hc_types.OT3Mount) -> None:
        ...

    def delete_instrument_offset_file(self, instrument_id: str, mount) -> None:
        """
        Delete instrument offset file based on mount and instrument serial number

        :param instrument_id: instrument serial number
        :param mount: instrument mount
        """
        if self._robot_type == "OT-2" and mount == hc_types.OT3Mount.GRIPPER:
            raise ValueError(f"Unsupported mount {hc_types.OT3Mount.GRIPPER} for {self._robot_type}.")
        
        if mount == hc_types.OT3Mount.GRIPPER:
            offset_path = (
                config.get_opentrons_path("gripper_calibration_dir") / f"{instrument_id}.json"
            )
            io.delete_file(offset_path)
        else:
            offset_dir = config.get_opentrons_path("pipette_calibration_dir")
            offset_path = offset_dir / mount.name.lower() / f"{instrument_id}.json"
            io.delete_file(offset_path)

    @overload
    def clear_instrument_offset_calibrations(self, mount: opentrons_types.Mount) -> None:
        ...

    @overload
    def clear_instrument_offset_calibrations(self, mount: hc_types.OT3Mount) -> None:
        ...

    def clear_instrument_offset_calibrations(self, mount) -> None:
        if mount == hc_types.OT3Mount.GRIPPER:
            offset_dir = config.get_opentrons_path("gripper_calibration_dir")
        else:
            offset_dir = config.get_opentrons_path("pipette_calibration_dir")
        io._remove_json_files_in_directories(offset_dir)
    
    @overload
    def save_instrument_calibration(
        offset: types.Point,
        instrument_id: str,
        mount: hc_types.OT3Mount,
        cal_status: Optional[
            Union[local_types.CalibrationStatus, v1.CalibrationStatus]
        ] = None,
    ) -> None:
        # Flex overload
        ...
        
    @overload
    def save_instrument_calibration(
        offset: Point,
        instrument_id: str,
        mount: opentrons_types.Mount,
        tiprack_hash: str,
        tiprack_uri: str,
        cal_status: typing.Optional[
            typing.Union[local_types.CalibrationStatus, v1.CalibrationStatus]
        ] = None,
    ) -> None:
        # OT-2 overload
        ...

    def save_instrument_calibration(
        offset,
        instrument_id,
        mount,
        tiprack_hash: Optional[str] = None,
        tiprack_uri: Optional[str] = None,
        cal_status: typing.Optional[
            typing.Union[local_types.CalibrationStatus, v1.CalibrationStatus]
        ] = None) -> None:

        if isinstance(cal_status, local_types.CalibrationStatus):
            cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
        elif isinstance(cal_status, v1.CalibrationStatus):
            cal_status_model = cal_status
        else:
            cal_status_model = v1.CalibrationStatus()

        instrument_calibration = InstrumentOffsetModel(
                offset=offset,
                lastModified=utc_now(),
                source=local_types.SourceType.user,
                status=cal_status_model,
            )
        if mount == hc_types.OT3Mount.GRIPPER:
            directory_path = config.get_opentrons_path("gripper_calibration_dir")
        else:
            directory_path = config.get_opentrons_path("pipette_calibration_dir") / mount.name.lower()

        io.save_to_file(directory_path, instrument_id, instrument_calibration)


    def get_instrument_offset(
        instrument_id: str, mount: types.Mount
    ) -> Optional[v1.InstrumentOffsetModel]:
        try:
            if mount == hc_types.OT3Mount.GRIPPER:
                calibration_filepath = (
                config.get_opentrons_path("pipette_calibration_dir")
                / mount.name.lower()
                / f"{instrument_id}.json"
            )
            else:
                calibration_filepath = (
                    config.get_opentrons_path("gripper_calibration_dir")
                    / f"{instrument_id}.json"
                )
            return v1.InstrumentOffsetModel(
                **io.read_cal_file(calibration_filepath)
            )
        except FileNotFoundError:
            log.warning(f"Calibrations for {instrument_id} on {mount} does not exist.")
            return None
        except (json.JSONDecodeError, ValidationError):
            log.warning(
                f"Malformed calibrations for {instrument_id} on {mount}. Please factory reset your calibrations."
            )
            return None
