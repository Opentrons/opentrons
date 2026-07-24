"""Tests for vacuum module defined error helpers."""

from datetime import datetime
from typing import cast

from decoy import Decoy

from opentrons_shared_data.errors.exceptions import (
    RoboticsControlError,
    VacuumModulePressureNotReachedError,
    VacuumModuleWasteFullError,
)

from opentrons.hardware_control.modules.types import VacuumOperationMode
from opentrons.protocol_engine.commands.vacuum_module.common import (
    VACUUM_PRESSURE_NOT_REACHED_ERROR_CODE,
    VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE,
    RecoverableVacuumHwExceptions,
    VacuumModuleCarboyFullError,
    VacuumModuleError,
    VacuumPressureNotReachedError,
    defined_error_data_from_task_error,
    handle_recoverable_vacuum_error,
    will_equalize_after_operation,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import update_types

DEFAULT_VACUUM_OPERATION_ERROR_INFO = {
    "mode": VacuumOperationMode.PRESSURE,
    "target": 0.0,
    "current": 0.0,
}


def test_defined_error_data_from_task_error_maps_carboy_full(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should map a waste-full task error to a defined carboy-full error."""
    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")
    task_error = ErrorOccurrence(
        id="task-error-id",
        createdAt=timestamp,
        errorType="VacuumModuleWasteFullError",
        errorCode=VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE,
        detail="Vacuum Module Waste Container Full",
        errorInfo={"serial": "VM123"},
    )

    result = defined_error_data_from_task_error(task_error, model_utils)

    assert result is not None
    assert isinstance(result.public, VacuumModuleCarboyFullError)
    assert result.public.errorType == "vacuumCarboyFull"
    assert result.public.isDefined is True
    assert result.public.wrappedErrors == [task_error]
    assert result.public.errorInfo == DEFAULT_VACUUM_OPERATION_ERROR_INFO


def test_defined_error_data_from_task_error_maps_pressure_not_reached(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should map a pressure-not-reached task error to a defined command error."""
    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")
    task_error = ErrorOccurrence(
        id="task-error-id",
        createdAt=timestamp,
        errorType="VacuumModulePressureNotReachedError",
        errorCode=VACUUM_PRESSURE_NOT_REACHED_ERROR_CODE,
        detail="Vacuum Module Pressure Not Reached",
        errorInfo={"mode": "pressure", "target": "-100.0", "current": "-75.0"},
    )

    result = defined_error_data_from_task_error(task_error, model_utils)

    assert result is not None
    assert isinstance(result.public, VacuumPressureNotReachedError)
    assert result.public.errorType == "vacuumPressureNotReached"
    assert result.public.errorInfo == {
        "mode": "pressure",
        "target": -100.0,
        "current": -75.0,
    }


def test_handle_recoverable_vacuum_error_maps_waste_full(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should map a waste-full hardware error to defined command error data."""
    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")

    result = handle_recoverable_vacuum_error(
        VacuumModuleWasteFullError("VM123", "pressure", 0.0, 0.0),
        update_types.StateUpdate(),
        model_utils,
    )

    assert isinstance(result.public, VacuumModuleCarboyFullError)
    assert result.public.errorType == "vacuumCarboyFull"
    assert result.public.errorInfo == DEFAULT_VACUUM_OPERATION_ERROR_INFO


def test_handle_recoverable_vacuum_error_maps_pressure_not_reached(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should map a pressure-not-reached hardware error to defined command error data."""
    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")

    result = handle_recoverable_vacuum_error(
        VacuumModulePressureNotReachedError("VM123", "power", -100.0, -75.0),
        update_types.StateUpdate(),
        model_utils,
    )

    assert isinstance(result.public, VacuumPressureNotReachedError)
    assert result.public.errorType == "vacuumPressureNotReached"
    assert result.public.errorInfo == {
        "mode": "power",
        "target": -100.0,
        "current": -75.0,
    }


def test_handle_recoverable_vacuum_error_returns_generic_error_for_unmapped_error(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should return a generic vacuum module error when mapping is unknown."""

    class _UnhandledRecoverableVacuumError(Exception):
        pass

    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")

    result = handle_recoverable_vacuum_error(
        cast(RecoverableVacuumHwExceptions, _UnhandledRecoverableVacuumError()),
        update_types.StateUpdate(),
        model_utils,
    )

    assert isinstance(result.public, VacuumModuleError)
    assert result.public.errorType == "vacuumModuleError"
    assert result.public.isDefined is True
    assert len(result.public.wrappedErrors) == 1
    assert result.public.wrappedErrors[0].errorType == "PythonException"
    assert result.public.errorInfo == DEFAULT_VACUUM_OPERATION_ERROR_INFO


def test_handle_recoverable_vacuum_error_populates_operation_error_info_from_hw_detail(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should include vacuum operation context in generic errorInfo when available."""
    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")

    result = handle_recoverable_vacuum_error(
        cast(
            RecoverableVacuumHwExceptions,
            RoboticsControlError(
                detail={
                    "mode": "pressure",
                    "target": "-100.0",
                    "current": "-80.0",
                },
            ),
        ),
        update_types.StateUpdate(),
        model_utils,
    )

    assert isinstance(result.public, VacuumModuleError)
    assert result.public.errorInfo == {
        "mode": "pressure",
        "target": -100.0,
        "current": -80.0,
    }


def test_will_equalize_after_operation() -> None:
    """It should only clear residual vacuum when equalize is explicitly requested."""
    assert will_equalize_after_operation(
        vent_after=True, equalize_timeout=30, duration=10
    )
    assert not will_equalize_after_operation(
        vent_after=True, equalize_timeout=None, duration=10
    )
    assert not will_equalize_after_operation(
        vent_after=False, equalize_timeout=30, duration=10
    )
    assert not will_equalize_after_operation(
        vent_after=True, equalize_timeout=30, duration=None
    )
    assert will_equalize_after_operation(
        vent_after=True, equalize_timeout=30, require_duration=False
    )
    assert not will_equalize_after_operation(
        vent_after=True, equalize_timeout=0, duration=10
    )
