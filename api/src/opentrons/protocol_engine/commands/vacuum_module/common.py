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


class FailedOperation(TypedDict):
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

    errorInfo: FailedOperation


class VacuumModuleError(ErrorOccurrence):
    """Returned when a recoverable vacuum module error has no specific mapping."""

    isDefined: bool = False
    errorType: Literal["vacuumModuleError"] = "vacuumModuleError"

    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code
    detail: str = ErrorCodes.GENERAL_ERROR.value.detail

    errorInfo: FailedOperation


VacuumModuleCommandDefinedError = Union[
    VacuumPressureNotReachedError,
    VacuumModuleCarboyFullError,
    VacuumModuleError,
]

VacuumModuleDefinedErrorData = Union[
    DefinedErrorData[VacuumPressureNotReachedError],
    DefinedErrorData[VacuumModuleCarboyFullError],
    DefinedErrorData[VacuumModuleError],
]

RecoverableVacuumHwExceptionTypes = (
    VacuumModulePressureNotReachedError,
    VacuumModuleWasteFullError,
)

RecoverableVacuumHwExceptions = (
    VacuumModulePressureNotReachedError | VacuumModuleWasteFullError
)


def _float_from_optional(value: object | None) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        return float(value)
    return 0.0


def _vacuum_operation_error_info(
    *,
    mode: object | None = None,
    target: object | None = None,
    current: object | None = None,
) -> FailedOperation:
    return {
        "mode": cast(
            VacuumOperationMode,
            mode if mode is not None else VacuumOperationMode.PRESSURE,
        ),
        "target": _float_from_optional(target),
        "current": _float_from_optional(current),
    }


def _vacuum_operation_error_info_from_mapping(
    error_info: Mapping[str, object],
) -> FailedOperation:
    return _vacuum_operation_error_info(
        mode=error_info.get("mode"),
        target=error_info.get("target"),
        current=error_info.get("current"),
    )


def handle_recoverable_vacuum_error(
    error: RecoverableVacuumHwExceptions,
    state_update: update_types.StateUpdate,
    model_utils: ModelUtils,
) -> VacuumModuleDefinedErrorData:
    """Map a recoverable vacuum hardware error to defined command error data."""
    timestamp = model_utils.get_timestamp()
    enumerated_error = (
        error if isinstance(error, EnumeratedError) else EnumeratedError.ensure(error)
    )
    wrapped_error = ErrorOccurrence.from_failed(
        id=model_utils.generate_id(),
        createdAt=timestamp,
        error=enumerated_error,
    )

    if isinstance(error, VacuumModuleWasteFullError):
        return DefinedErrorData(
            public=VacuumModuleCarboyFullError(
                id=model_utils.generate_id(),
                createdAt=timestamp,
                wrappedErrors=[wrapped_error],
                errorInfo=_vacuum_operation_error_info(
                    mode=error.mode,
                    target=error.target,
                    current=error.current,
                ),
            ),
            state_update_if_false_positive=state_update,
        )

    if isinstance(error, VacuumModulePressureNotReachedError):
        return DefinedErrorData(
            public=VacuumPressureNotReachedError(
                id=model_utils.generate_id(),
                createdAt=timestamp,
                wrappedErrors=[wrapped_error],
                errorInfo=_vacuum_operation_error_info(
                    mode=error.mode,
                    target=error.target_pressure,
                    current=error.current_pressure,
                ),
            ),
            state_update_if_false_positive=state_update,
        )

    return DefinedErrorData(
        public=VacuumModuleError(
            id=model_utils.generate_id(),
            createdAt=timestamp,
            wrappedErrors=[wrapped_error],
            errorInfo=_vacuum_operation_error_info(
                mode=enumerated_error.detail.get("mode"),
                target=enumerated_error.detail.get("target"),
                current=enumerated_error.detail.get("current"),
            ),
        ),
        state_update_if_false_positive=state_update,
    )


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

    operation_error_info = _vacuum_operation_error_info_from_mapping(
        task_error.errorInfo
    )

    if error_code == VACUUM_WASTE_CONTAINER_FULL_ERROR_CODE:
        return DefinedErrorData(
            public=VacuumModuleCarboyFullError(
                id=error_id,
                createdAt=timestamp,
                wrappedErrors=[task_error],
                errorInfo=operation_error_info,
            ),
            state_update_if_false_positive=false_positive_update,
        )

    elif error_code == VACUUM_PRESSURE_NOT_REACHED_ERROR_CODE:
        return DefinedErrorData(
            public=VacuumPressureNotReachedError(
                id=error_id,
                createdAt=timestamp,
                wrappedErrors=[task_error],
                errorInfo=operation_error_info,
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
