class ModuleOffsetModel(BaseModel):
    offset: Point = Field(..., description="Module offset found from calibration.")
    mount: OT3Mount = Field(..., description="The mount used to calibrate this module.")
    slot: int = Field(..., description="The slot this module was calibrated in.")
    module: ModuleType = Field(..., description="The module type of this module.")
    module_id: str = Field(..., description="The unique id of this module.")
    instrument_id: str = Field(
        ...,
        description="The unique id of the instrument used to calibrate this module.",
    )
    lastModified: datetime = Field(
        ..., description="The last time this module was calibrated."
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


class ModuleCalibrationHandlerProvider(Generic[RobotType]):
    def __init__(self):
        self._robot_type = 'OT-2'
        self._model_version = "1.0.0"
        
    def delete_module_offset_file(module_id: str) -> None:
        """
        Delete module offset file for the given module id.

        :param module: module id serial number
        """
        offset_dir = config.get_opentrons_path("module_calibration_dir")
        offset_path = offset_dir / f"{module_id}.json"
        io.delete_file(offset_path)


    def clear_module_offset_calibrations() -> None:
        """
        Delete all module offset calibration files.
        """

        offset_dir = config.get_opentrons_path("module_calibration_dir")
        io._remove_json_files_in_directories(offset_dir)


    # Save Module Offset Calibrations

    def save_module_calibration(
        offset: types.Point,
        mount: OT3Mount,
        slot: int,
        module: ModuleType,
        module_id: str,
        instrument_id: Optional[str] = None,
        cal_status: Optional[
            Union[local_types.CalibrationStatus, v1.CalibrationStatus]
        ] = None,
    ) -> None:
        module_dir = config.get_opentrons_path("module_calibration_dir")
        if isinstance(cal_status, local_types.CalibrationStatus):
            cal_status_model = v1.CalibrationStatus(**asdict(cal_status))
        elif isinstance(cal_status, v1.CalibrationStatus):
            cal_status_model = cal_status
        else:
            cal_status_model = v1.CalibrationStatus()

        module_calibration = ModuleOffsetModel(
            offset=offset,
            mount=mount,
            slot=slot,
            module=module,
            module_id=module_id,
            instrument_id=instrument_id,
            lastModified=utc_now(),
            source=local_types.SourceType.user,
            status=cal_status_model,
        )
        io.save_to_file(module_dir, module_id, module_calibration)


    # Get Module Offset Calibrations

    def get_module_offset(
        module: ModuleType, module_id: str, slot: Optional[int] = None
    ) -> Optional[ModuleOffsetModel]:
        try:
            module_calibration_filepath = (
                config.get_opentrons_path("module_calibration_dir") / f"{module_id}.json"
            )
            return ModuleOffsetModel(**io.read_cal_file(module_calibration_filepath))
        except FileNotFoundError:
            log.warning(
                f"Calibrations for {module} {module_id} on slot {slot} does not exist."
            )
            return None
        except (json.JSONDecodeError, ValidationError):
            log.warning(
                f"Malformed calibrations for {module_id} on slot {slot}. Please factory reset your calibrations."
            )
            return None


    def load_all_module_offsets() -> List[ModuleOffsetModel]:
        """Load all module offsets from the disk."""

        calibrations: List[ModuleOffsetModel] = []
        files = os.listdir(config.get_opentrons_path("module_calibration_dir"))
        for file in files:
            try:
                calibrations.append(
                    ModuleOffsetModel(
                        **io.read_cal_file(
                            Path(config.get_opentrons_path("module_calibration_dir") / file)
                        )
                    )
                )
            except (json.JSONDecodeError, ValidationError):
                log.warning(
                    f"Malformed module calibrations for {file}. Please factory reset your calibrations."
                )
                continue
        return calibrations

