"""Shared vacuum module command error models."""

from __future__ import annotations

from typing import Literal, Mapping, TypedDict, Union, cast

from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.errors.exceptions import (
    EnumeratedError,
    VacuumModulePressureNotReachedError,
    VacuumModuleWasteFullError,
)

from ...commands.command import DefinedErrorData
from ...errors.error_occurrence import ErrorOccurrence
from ...resources import ModelUtils
from ...state import update_types
from opentrons.hardware_control.modules.types import VacuumOperationMode

VACUUM_PRESSURE_NOT_REACHED_ERROR_CODE = (
    ErrorCodes.VACUUM_PRESSURE_NOT_REACHED.value.code
)
VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE = (
    ErrorCodes.VACUUM_WASTE_CONTAINER_FULL.value.code
)

RECOVERABLE_VACUUM_ERROR_CODES = frozenset(
    {
        VACUUM_PRESSURE_NOT_REACHED_ERROR_CODE,
        VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE,
    }
)


class FailedOperation(TypedDict, total=False):
    """Holds the target and current data when the error occured."""

    mode: VacuumOperationMode
    target: float
    current: float


class VacuumPressureNotReachedError(ErrorOccurrence):
    """Returned when the target pressure is not reached within a timeout."""

    isDefined: bool = True
    errorType: Literal["vacuumPressureNotReached"] = "vacuumPressureNotReached"

    errorCode: str = ErrorCodes.VACUUM_PRESSURE_NOT_REACHED.value.code
    detail: str = ErrorCodes.VACUUM_PRESSURE_NOT_REACHED.value.detail

    errorInfo: FailedOperation


class VacuumModuleCarboyFullError(ErrorOccurrence):
    """Returned when the vacuum module waste carboy is full."""

    isDefined: bool = True
    errorType: Literal["vacuumCarboyFull"] = "vacuumCarboyFull"

    errorCode: str = ErrorCodes.VACUUM_WASTE_CONTAINER_FULL.value.code
    detail: str = ErrorCodes.VACUUM_WASTE_CONTAINER_FULL.value.detail

    errorInfo: dict[str, object]


VacuumModuleDefinedErrorData = Union[
    DefinedErrorData[VacuumPressureNotReachedError],
    DefinedErrorData[VacuumModuleCarboyFullError],
]

RecoverableVacuumHwExceptionTypes = (
    VacuumModulePressureNotReachedError,
    VacuumModuleWasteFullError,
)

RecoverableVacuumHwExceptions = (
    VacuumModulePressureNotReachedError | VacuumModuleWasteFullError
)


def handle_recoverable_vacuum_error(
    error: RecoverableVacuumHwExceptions,
    state_update: update_types.StateUpdate,
    model_utils: ModelUtils,
) -> VacuumModuleDefinedErrorData:
    """Map a recoverable vacuum hardware error to defined command error data."""
    timestamp = model_utils.get_timestamp()
    wrapped_error = ErrorOccurrence.from_failed(
        id=model_utils.generate_id(),
        createdAt=timestamp,
        error=error,
    )

    if isinstance(error, VacuumModuleWasteFullError):
        return DefinedErrorData(
            public=VacuumModuleCarboyFullError(
                id=model_utils.generate_id(),
                createdAt=timestamp,
                wrappedErrors=[wrapped_error],
                errorInfo={},
            ),
            state_update_if_false_positive=state_update,
        )

    elif isinstance(error, VacuumModulePressureNotReachedError):
        return DefinedErrorData(
            public=VacuumPressureNotReachedError(
                id=model_utils.generate_id(),
                createdAt=timestamp,
                wrappedErrors=[wrapped_error],
                errorInfo={
                    "mode": cast(
                        VacuumOperationMode,
                        error.detail.get("mode", VacuumOperationMode.PRESSURE),
                    ),
                    "target": error.target_pressure,
                    "current": error.current_pressure,
                },
            ),
            state_update_if_false_positive=state_update,
        )

    raise TypeError(
        f"No defined error mapping for recoverable vacuum hardware error "
        f"{type(error).__name__!r}."
    )


def _float_from_error_info(error_info: Mapping[str, object], key: str) -> float:
    value = error_info.get(key)
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        return float(value)
    return 0.0


def is_recoverable_module_error(error: ErrorOccurrence | EnumeratedError) -> bool:
    """Return whether the error is a module error eligible for command recovery."""
    if isinstance(error, ErrorOccurrence):
        error_code = error.errorCode
        if error_code in RECOVERABLE_VACUUM_ERROR_CODES:
            return True
        return any(
            is_recoverable_module_error(wrapped) for wrapped in error.wrappedErrors
        )
    return error.code.value.code in RECOVERABLE_VACUUM_ERROR_CODES


def defined_error_data_from_task_error(
    task_error: ErrorOccurrence,
    model_utils: ModelUtils,
    state_update_if_false_positive: update_types.StateUpdate | None = None,
) -> VacuumModuleDefinedErrorData | None:
    """Map a failed module task error to a defined command error."""
    error_code = task_error.errorCode
    if error_code not in RECOVERABLE_VACUUM_ERROR_CODES:
        for wrapped_error in task_error.wrappedErrors:
            mapped = defined_error_data_from_task_error(wrapped_error, model_utils)
            if mapped is not None:
                return mapped
        return None

    timestamp = model_utils.get_timestamp()
    error_id = model_utils.generate_id()

    false_positive_update = (
        state_update_if_false_positive
        if state_update_if_false_positive is not None
        else update_types.StateUpdate()
    )

    if error_code == VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE:
        return DefinedErrorData(
            public=VacuumModuleCarboyFullError(
                id=error_id,
                createdAt=timestamp,
                wrappedErrors=[task_error],
                errorInfo={},
            ),
            state_update_if_false_positive=false_positive_update,
        )

    elif error_code == VACUUM_PRESSURE_NOT_REACHED_ERROR_CODE:
        mode_value = task_error.errorInfo.get("mode", VacuumOperationMode.PRESSURE)
        return DefinedErrorData(
            public=VacuumPressureNotReachedError(
                id=error_id,
                createdAt=timestamp,
                wrappedErrors=[task_error],
                errorInfo={
                    "mode": cast(VacuumOperationMode, mode_value),
                    "target": _float_from_error_info(task_error.errorInfo, "target"),
                    "current": _float_from_error_info(task_error.errorInfo, "current"),
                },
            ),
            state_update_if_false_positive=false_positive_update,
        )
    return None


def defined_error_data_from_enumerated_error(
    error: EnumeratedError,
    model_utils: ModelUtils,
    state_update_if_false_positive: update_types.StateUpdate | None = None,
) -> VacuumModuleDefinedErrorData | None:
    """Map a vacuum hardware error to defined command error data."""
    task_error = ErrorOccurrence.from_failed(
        id=model_utils.generate_id(),
        createdAt=model_utils.get_timestamp(),
        error=error,
    )
    return defined_error_data_from_task_error(
        task_error,
        model_utils,
        state_update_if_false_positive=state_update_if_false_positive,
    )
