import { useTranslation } from 'react-i18next'

import { RUN_STATUS_BLOCKED_BY_OPEN_DOOR } from '@opentrons/api-client'

import { useIsDoorOpen } from '../../../hooks'
import { useIsFixtureMismatch } from './useIsFixtureMismatch'
import {
  isCancellableStatus,
  isDisabledStatus,
  isStartRunStatus,
} from '../../../utils'

import type { BaseActionButtonProps } from '..'

interface UseActionButtonDisabledUtilsProps extends BaseActionButtonProps {
  isCurrentRun: boolean
  isValidRunAgain: boolean
  isSetupComplete: boolean
  isOtherRunCurrent: boolean
  isProtocolNotReady: boolean
  isRobotOnWrongVersionOfSoftware: boolean
  isClosingCurrentRun: boolean
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
    isCurrentRun,
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
  } = props

  const {
    isPlayRunActionLoading,
    isPauseRunActionLoading,
  } = protocolRunControls
  const isDoorOpen = useIsDoorOpen(robotName)
  const isFixtureMismatch = useIsFixtureMismatch(runId, robotName)
  const isResetRunLoading = isResetRunLoadingRef.current

  const isDisabled =
    (isCurrentRun && !isSetupComplete) ||
    isPlayRunActionLoading ||
    isPauseRunActionLoading ||
    isResetRunLoading ||
    isClosingCurrentRun ||
    isOtherRunCurrent ||
    isProtocolNotReady ||
    isFixtureMismatch ||
    isDisabledStatus(runStatus) ||
    isRobotOnWrongVersionOfSoftware ||
    (isDoorOpen &&
      runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
      isCancellableStatus(runStatus))

  const disabledReason = useDisabledReason({
    ...props,
    isDoorOpen,
    isFixtureMismatch,
    isResetRunLoading,
  })

  return isDisabled
    ? { isDisabled: true, disabledReason }
    : { isDisabled: false, disabledReason: null }
}

type UseDisabledReasonProps = UseActionButtonDisabledUtilsProps & {
  isDoorOpen: boolean
  isFixtureMismatch: boolean
  isResetRunLoading: boolean
  isClosingCurrentRun: boolean
}

// The user-facing disabled explanation for why the ActionButton is disabled, if any.
function useDisabledReason({
  isCurrentRun,
  isSetupComplete,
  isFixtureMismatch,
  isValidRunAgain,
  isOtherRunCurrent,
  isRobotOnWrongVersionOfSoftware,
  isDoorOpen,
  runStatus,
  isResetRunLoading,
  isClosingCurrentRun,
}: UseDisabledReasonProps): string | null {
  const { t } = useTranslation(['run_details', 'shared'])

  if (
    isCurrentRun &&
    (!isSetupComplete || isFixtureMismatch) &&
    !isValidRunAgain
  ) {
    return t('setup_incomplete')
  } else if (isOtherRunCurrent && !isResetRunLoading) {
    return t('shared:robot_is_busy')
  } else if (isRobotOnWrongVersionOfSoftware) {
    return t('shared:a_software_update_is_available')
  } else if (isDoorOpen && isStartRunStatus(runStatus)) {
    return t('close_door')
  } else if (isClosingCurrentRun) {
    return t('shared:robot_is_busy')
  } else {
    return null
  }
}
