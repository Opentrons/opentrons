import json
from typing import Generic, Union, Optional, overload

from pydantic import BaseModel, ValidationError, Field

from opentrons import config
from . import file_operators as io, types as local_types


AttitudeMatrix = []

class DeckCalibrationModelOT3(BaseModel):
    attitude: types.AttitudeMatrix = Field(
        ..., description="Attitude matrix found from calibration."
    )
    lastModified: datetime = Field(
        ..., description="The last time this deck was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    pipetteCalibratedWith: typing.Optional[str] = Field(
        default=None, description="The pipette id used to calibrate the deck."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class DeckCalibrationModelOT2(BaseModel):
    attitude: AttitudeMatrix = Field(
        ..., description="Attitude matrix found from calibration."
    )
    last_modified: datetime = Field(
        default=None, description="The last time this deck was calibrated."
    )
    source: local_types.SourceType = Field(
        default=local_types.SourceType.factory, description="The source of calibration."
    )
    pipette_calibrated_with: Optional[str] = Field(
        default=None, description="The pipette id used to calibrate the deck."
    )
    tiprack: Optional[str] = Field(
        default=None, description="The tiprack id used to calibrate the deck."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}

class RobotDeckCalibrationHandlerProvider(Generic[RobotType]):
    def __init__(self) -> None:
        self._robot_type = 'OT-2'
        self._model_version = "1.0.0"
    
    def delete_robot_deck_attitude(self) -> None:
        if self._robot_type = 'OT-2':
            legacy_deck_calibration_file = config.get_opentrons_path("deck_calibration_file")

            # TODO(mc, 2022-06-08): this leaves legacy deck calibration backup files in place
            # we should eventually clean them up, too, because they can really crowd /data/
            io.delete_file(legacy_deck_calibration_file)
        gantry_path = (
        config.get_opentrons_path("robot_calibration_dir") / "deck_calibration.json"
        )

        io.delete_file(gantry_path)
        return None
    
    @overload
    def save_robot_deck_attitude(
        self,
        transform: local_types.AttitudeMatrix,
        pip_id: Optional[str],
        source: Optional[local_types.SourceType] = None,
        cal_status: Optional[
            Union[local_types.CalibrationStatus, local_types.CalibrationStatus]
        ] = None,
    ) -> None:
        # Flex Function Overload
        ...
    
    @overload
    def save_robot_deck_attitude(
        self,
        transform: local_types.AttitudeMatrix,
        pip_id: Optional[str],
        lw_hash: Optional[str],
        source: Optional[local_types.SourceType] = None,
        cal_status: Optional[
            Union[local_types.CalibrationStatus, v1.CalibrationStatus]
        ] = None,
    ) -> None:
        # OT2 Function Overload
        ...

    def save_robot_deck_attitude(
        self,
        transform: local_types.AttitudeMatrix,
        pip_id: Optional[str],
        source: Optional[local_types.SourceType] = None,
        cal_status: Optional[
            Union[local_types.CalibrationStatus, local_types.CalibrationStatus]
        ] = None) -> None:
        DeckCalibrationModel.parse_obj({"version": self._model_version})
        robot_dir = config.get_opentrons_path("robot_calibration_dir")

        if isinstance(cal_status, local_types.CalibrationStatus):
            cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
        elif isinstance(cal_status, v1.CalibrationStatus):
            cal_status_model = cal_status
        else:
            cal_status_model = v1.CalibrationStatus()

        gantry_calibration = v1.DeckCalibrationModel(
            attitude=transform,
            pipette_calibrated_with=pip_id,
            last_modified=utc_now(),
            tiprack=lw_hash,
            source=source or local_types.SourceType.user,
            status=cal_status_model,
        )
        # convert to schema + validate json conversion
        io.save_to_file(robot_dir, "deck_calibration", gantry_calibration)

    def get_robot_deck_attitude(self):
        deck_calibration_path = (
            config.get_opentrons_path("robot_calibration_dir") / "deck_calibration.json"
        )
        try:
            return DeckCalibrationModel(**io.read_cal_file(deck_calibration_path))
        except FileNotFoundError:
            log.warning("Deck calibration not found.")
            pass
        except (json.JSONDecodeError, ValidationError):
            log.warning(
                "Deck calibration is malformed. Please factory reset your calibrations."
            )
            pass
        return None
