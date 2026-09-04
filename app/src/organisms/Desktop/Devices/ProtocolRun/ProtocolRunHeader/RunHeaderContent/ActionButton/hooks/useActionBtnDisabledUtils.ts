import { useTranslation } from 'react-i18next'

import { RUN_STATUS_BLOCKED_BY_OPEN_DOOR } from '@opentrons/api-client'

import {
  isCancellableStatus,
  isDisabledStatus,
  isStartRunStatus,
} from '/app/local-resources/runs/utils'
import {
  useCurrentRunId,
  useModuleCalibrationStatus,
  useRunCalibrationStatus,
  useUnmatchedModulesForProtocol,
} from '/app/resources/runs'

import { useIsDoorOpen } from '../../../hooks'
import { useIsFixtureMismatch } from './useIsFixtureMismatch'

import type { RunControls } from '/app/organisms/RunTimeControl'
import type { BaseActionButtonProps } from '..'
import type { DoorResult } from '../../../../../../../DoorOpenControl/useIsDoorOpen'

interface UseActionButtonDisabledUtilsProps extends BaseActionButtonProps {
  robotName: string
  runId: string
  isValidRunAgain: boolean
  isSetupComplete: boolean
  isOtherRunCurrent: boolean
  isProtocolNotReady: boolean
  isRobotOnWrongVersionOfSoftware: boolean
  isClosingCurrentRun: boolean
  isCameraReadyToRun: boolean
  protocolRunControls: RunControls
}

type UseActionButtonDisabledUtilsResult =
  | { isDisabled: true; disabledReason: string | null }
  | { isDisabled: false; disabledReason: null }

// Manages the various reasons the ActionButton may be disabled, returning the disabled state and user-facing disabled
// reason copy if applicable.
export function useActionBtnDisabledUtils(
  props: UseActionButtonDisabledUtilsProps
): UseActionButtonDisabledUtilsResult {
  const {
    isSetupComplete,
    isOtherRunCurrent,
    isProtocolNotReady,
    runStatus,
    isRobotOnWrongVersionOfSoftware,
    protocolRunControls,
    robotName,
    runId,
    isResetRunLoadingRef,
    isClosingCurrentRun,
    isCameraReadyToRun,
  } = props

  const { isPlayRunActionLoading, isPauseRunActionLoading } =
    protocolRunControls
  const doorStatus = useIsDoorOpen(robotName)
  const isFixtureMismatch = useIsFixtureMismatch(runId, robotName)
  const isResetRunLoading = isResetRunLoadingRef.current
  const isCurrentRun = useCurrentRunId() === runId
  const isCalibrationComplete = useRunCalibrationStatus(
    robotName,
    runId
  ).complete
  const isModuleCalibrationComplete = useModuleCalibrationStatus(
    robotName,
    runId
  ).complete
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)

  const isMissingModules = missingModuleIds.length > 0
  const isDisabled =
    (isCurrentRun && !isSetupComplete) ||
    isMissingModules ||
    isModuleCalibrationComplete ||
    isCalibrationComplete ||
    isPlayRunActionLoading ||
    isPauseRunActionLoading ||
    isResetRunLoading ||
    isClosingCurrentRun ||
    isOtherRunCurrent ||
    isProtocolNotReady ||
    isFixtureMismatch ||
    isDisabledStatus(runStatus) ||
    !isCameraReadyToRun ||
    isRobotOnWrongVersionOfSoftware ||
    (doorStatus.isDoorOpen &&
      runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
      isCancellableStatus(runStatus))

  const disabledReason = useDisabledReason({
    isFixtureMismatch,
    doorStatus,
    isResetRunLoading,
    isMissingModules,
    isModuleCalibrationComplete,
    isCalibrationComplete,
    ...props,
  })

  return isDisabled
    ? { isDisabled: true, disabledReason }
    : { isDisabled: false, disabledReason: null }
}

type UseDisabledReasonProps = UseActionButtonDisabledUtilsProps & {
  doorStatus: DoorResult
  isFixtureMismatch: boolean
  isResetRunLoading: boolean
  isClosingCurrentRun: boolean
  isModuleCalibrationComplete: boolean
  isMissingModules: boolean
  isCalibrationComplete: boolean
  isCameraReadyToRun: boolean
}

// The user-facing disabled explanation for why the ActionButton is disabled, if any.
function useDisabledReason({
  isFixtureMismatch,
  isValidRunAgain,
  isOtherRunCurrent,
  isRobotOnWrongVersionOfSoftware,
  doorStatus,
  runStatus,
  isResetRunLoading,
  isClosingCurrentRun,
  isMissingModules,
  isModuleCalibrationComplete,
  isCalibrationComplete,
  isCameraReadyToRun,
}: UseDisabledReasonProps): string | null {
  const { t } = useTranslation(['run_details', 'shared'])
  if (isRobotOnWrongVersionOfSoftware) {
    return t('shared:a_software_update_is_available')
  } else if (isClosingCurrentRun) {
    return t('shared:robot_is_busy')
  } else if (!isCameraReadyToRun) {
    return t('enable_camera')
  } else if (isFixtureMismatch) {
    return t('fixture_mismatch')
  } else if (!isValidRunAgain) {
    return t('run_again_disabled')
  } else if (isOtherRunCurrent && !isResetRunLoading) {
    return t('shared:robot_is_busy')
  } else if (!isCalibrationComplete) {
    return t('instrument_calibration_incomplete')
  } else if (isMissingModules) {
    return t('modules_missing')
  } else if (!isModuleCalibrationComplete) {
    return t('module_calibration_incomplete')
  } else if (
    doorStatus.isDoorOpen &&
    doorStatus.moduleDoorLocation !== null &&
    isStartRunStatus(runStatus)
  ) {
    return t('close_stacker_door')
  } else if (doorStatus.isDoorOpen && isStartRunStatus(runStatus)) {
    return t('close_door')
  } else {
    return null
  }
}
