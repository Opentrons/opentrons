import { useTranslation } from 'react-i18next'

import { AlertPrimaryButton, SPACING } from '@opentrons/components'

import { DROP_TIP_SPECIAL_ERROR_TYPES } from '../constants'
import { SmallButton } from '/app/atoms/buttons'

import type { RunCommandError } from '@opentrons/shared-data'
import type { ErrorDetails } from '../types'

export interface SetRobotErrorDetailsParams {
  runCommandError?: RunCommandError
  message?: string
  header?: string
  type?: RunCommandError['errorType']
}

/**
 * @description Wraps the error state setter, updating the setter if the error should be special-cased.
 */
export function useDropTipCommandErrors(
  setErrorDetails: (errorDetails: ErrorDetails) => void
): (cbProps: SetRobotErrorDetailsParams) => void {
  const { t } = useTranslation('drop_tip_wizard')

  return ({
    runCommandError,
    message,
    header,
    type,
  }: SetRobotErrorDetailsParams) => {
    if (
      runCommandError?.errorType ===
      DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR
    ) {
      const headerText = t('cant_safely_drop_tips')
      const messageText = t('remove_the_tips_manually')

      setErrorDetails({
        header: headerText,
        message: messageText,
        type: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
      })
    } else {
      const messageText = message ?? ''
      setErrorDetails({ header, message: messageText, type })
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
}

/**
 * @description Returns special-cased components given error details.
 */
export function useDropTipErrorComponents({
  errorDetails,
  isOnDevice,
  handleMustHome,
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

  return errorDetails?.type === DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR
    ? buildHandleMustHome()
    : buildGenericError()
}
