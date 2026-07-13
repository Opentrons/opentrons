import { useTranslation } from 'react-i18next'

import { AlertPrimaryButton, SPACING } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { isMaintenanceDoorOpenError } from '/app/local-resources/maintenance_runs/utils/isDoorOpenError'

import { DROP_TIP_SPECIAL_ERROR_TYPES } from '../constants'

import type { RunCommandError } from '@opentrons/shared-data'
import type { ErrorDetails } from '../types'

export interface SetRobotErrorDetailsParams {
  message: string | null
  header?: string
  type?: RunCommandError['errorType']
}

/**
 * If the given error is a door-open maintenance command rejection, return
 * SetRobotErrorDetailsParams that will render the door-open error variant.
 * Otherwise return null.
 */
export function getDoorOpenErrorDetails(
  error: unknown
): SetRobotErrorDetailsParams | null {
  if (isMaintenanceDoorOpenError(error)) {
    return {
      type: DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR as unknown as RunCommandError['errorType'],
      message: null,
    }
  }
  return null
}

/**
 * @description Wraps the error state setter, updating the setter if the error should be special-cased.
 */
export function useDropTipCommandErrors(
  setErrorDetails: (errorDetails: ErrorDetails) => void
): (cbProps: SetRobotErrorDetailsParams) => void {
  const { t } = useTranslation('drop_tip_wizard')

  return ({ message, header, type }: SetRobotErrorDetailsParams) => {
    if (type === DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR) {
      const headerText = t('cant_safely_drop_tips')
      const messageText = t('remove_the_tips_manually')

      setErrorDetails({
        header: headerText,
        message: messageText,
        type: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
      })
    } else if (type === DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR) {
      setErrorDetails({
        header: t('door_is_open'),
        message: t('close_door_and_try_again'),
        type: DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR,
      })
    } else {
      const messageText = message ?? ''
      setErrorDetails({
        header: header ?? t('cant_safely_drop_tips'),
        message: messageText ?? t('remove_the_tips_manually'),
        type,
      })
    }
  }
}

export interface DropTipErrorComponents {
  button: JSX.Element | null
  subHeader: JSX.Element
}

export interface UseDropTipErrorComponentsProps {
  isOnDevice: boolean
  errorDetails: ErrorDetails | null
  handleMustHome: () => Promise<void>
  handleClearError: () => void
}

/**
 * @description Returns special-cased components given error details.
 */
export function useDropTipErrorComponents({
  errorDetails,
  isOnDevice,
  handleMustHome,
  handleClearError,
}: UseDropTipErrorComponentsProps): DropTipErrorComponents {
  const { t } = useTranslation('drop_tip_wizard')

  function buildGenericError(): DropTipErrorComponents {
    return {
      button: null,
      subHeader: (
        <>
          {t('drop_tip_failed')}
          <br />
          {errorDetails?.message}
        </>
      ),
    }
  }

  function buildHandleMustHome(): DropTipErrorComponents {
    const handleOnClick = (): void => {
      void handleMustHome()
    }

    return {
      button: isOnDevice ? (
        <SmallButton
          buttonType="alert"
          buttonText={t('confirm_removal_and_home')}
          onClick={handleOnClick}
          marginRight={SPACING.spacing4}
        />
      ) : (
        <AlertPrimaryButton onClick={handleOnClick}>
          {t('confirm_removal_and_home')}
        </AlertPrimaryButton>
      ),
      subHeader: <>{errorDetails?.message}</>,
    }
  }

  function buildDoorOpenError(): DropTipErrorComponents {
    return {
      button: isOnDevice ? (
        <SmallButton
          buttonText={t('try_again')}
          onClick={handleClearError}
          marginRight={SPACING.spacing4}
        />
      ) : (
        <AlertPrimaryButton onClick={handleClearError}>
          {t('try_again')}
        </AlertPrimaryButton>
      ),
      subHeader: <>{errorDetails?.message}</>,
    }
  }

  if (errorDetails?.type === DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR) {
    return buildDoorOpenError()
  }
  return errorDetails?.type === DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR
    ? buildHandleMustHome()
    : buildGenericError()
}
