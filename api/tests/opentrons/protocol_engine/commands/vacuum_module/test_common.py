"""Tests for vacuum module defined error helpers."""

from datetime import datetime
from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.errors.exceptions import (
    VacuumModulePressureNotReachedError as HwVacuumModulePressureNotReachedError,
)
from opentrons_shared_data.errors.exceptions import (
    VacuumModuleWasteFullError,
)

from opentrons.protocol_engine.commands.vacuum_module.common import (
    VACUUM_PRESSURE_NOT_REACHED_ERROR_CODE,
    VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE,
    RecoverableVacuumHwExceptions,
    VacuumModuleCarboyFullError,
    VacuumModulePressureNotReachedError,
    defined_error_data_from_task_error,
    handle_recoverable_vacuum_error,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import update_types


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
    assert isinstance(result.public, VacuumModulePressureNotReachedError)
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
        VacuumModuleWasteFullError("VM123"),
        update_types.StateUpdate(),
        model_utils,
    )

    assert isinstance(result.public, VacuumModuleCarboyFullError)
    assert result.public.errorType == "vacuumCarboyFull"


def test_handle_recoverable_vacuum_error_maps_pressure_not_reached(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should map a pressure-not-reached hardware error to defined command error data."""
    timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(timestamp)
    decoy.when(model_utils.generate_id()).then_return("defined-error-id")

    result = handle_recoverable_vacuum_error(
        HwVacuumModulePressureNotReachedError(
            "VM123",
            -100.0,
            -75.0,
            mode="power",
        ),
        update_types.StateUpdate(),
        model_utils,
    )

    assert isinstance(result.public, VacuumModulePressureNotReachedError)
    assert result.public.errorType == "vacuumPressureNotReached"
    assert result.public.errorInfo == {
        "mode": "power",
        "target": -100.0,
        "current": -75.0,
    }


def test_handle_recoverable_vacuum_error_raises_for_unmapped_error(
    decoy: Decoy,
    model_utils: ModelUtils,
) -> None:
    """It should raise when a recoverable vacuum error has no defined mapping."""

    class _UnhandledRecoverableVacuumError(Exception):
        pass

    with pytest.raises(TypeError, match="No defined error mapping"):
        handle_recoverable_vacuum_error(
            cast(RecoverableVacuumHwExceptions, _UnhandledRecoverableVacuumError()),
            update_types.StateUpdate(),
            model_utils,
        )
