import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { AlertPrimaryButton, SPACING } from '@opentrons/components'

import { DROP_TIP_SPECIAL_ERROR_TYPES } from './constants'
import { SmallButton } from '../../atoms/buttons'

import type { RunCommandError } from '@opentrons/shared-data'
import type { useChainMaintenanceCommands } from '../../resources/runs'

export interface ErrorDetails {
  message: string
  header?: string
  type?: string
}

interface HandleDropTipCommandErrorsCbProps {
  runCommandError?: RunCommandError
  message?: string
  header?: string
  type?: RunCommandError['errorType']
}

/**
 * @description Wraps the error state setter, updating the setter if the error should be special-cased.
 */
export function useHandleDropTipCommandErrors(
  setErrorDetails: (errorDetails: ErrorDetails) => void
): (cbProps: HandleDropTipCommandErrorsCbProps) => void {
  const { t } = useTranslation('drop_tip_wizard')

  return ({
    runCommandError,
    message,
    header,
    type,
  }: HandleDropTipCommandErrorsCbProps) => {
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

interface DropTipErrorComponents {
  button: JSX.Element | null
  subHeader: JSX.Element
}

export interface UseDropTipErrorComponentsProps {
  isOnDevice: boolean
  t: (translationString: string) => string
  maintenanceRunId: string | null
  onClose: () => void
  errorDetails: ErrorDetails | null
  chainRunCommands: ReturnType<
    typeof useChainMaintenanceCommands
  >['chainRunCommands']
}

/**
 * @description Returns special-cased components given error details.
 */
export function useDropTipErrorComponents({
  t,
  maintenanceRunId,
  onClose,
  errorDetails,
  isOnDevice,
  chainRunCommands,
}: UseDropTipErrorComponentsProps): DropTipErrorComponents {
  return errorDetails?.type === DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR
    ? buildHandleMustHome()
    : buildGenericError()

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
      if (maintenanceRunId !== null) {
        void chainRunCommands(
          maintenanceRunId,
          [
            {
              commandType: 'home' as const,
              params: {},
            },
          ],
          true
        )
        onClose()
      }
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
}

export interface UseWizardExitHeaderProps {
  isFinalStep: boolean
  hasInitiatedExit: boolean
  errorDetails: ErrorDetails | null
  handleCleanUpAndClose: (homeOnError?: boolean) => void
  confirmExit: (homeOnError?: boolean) => void
}

/**
 * @description Determines the appropriate onClick for the wizard exit button, ensuring the exit logic can occur at
 * most one time.
 */
export function useWizardExitHeader({
  isFinalStep,
  hasInitiatedExit,
  errorDetails,
  handleCleanUpAndClose,
  confirmExit,
}: UseWizardExitHeaderProps): () => void {
  return buildHandleExit()

  function buildHandleExit(): () => void {
    if (!hasInitiatedExit) {
      if (errorDetails != null) {
        // When an error occurs, do not home when exiting the flow via the wizard header.
        return buildNoHomeCleanUpAndClose()
      } else if (isFinalStep) {
        return buildHandleCleanUpAndClose()
      } else {
        return buildConfirmExit()
      }
    } else {
      return buildGenericCase()
    }
  }

  function buildGenericCase(): () => void {
    return () => null
  }
  function buildNoHomeCleanUpAndClose(): () => void {
    return () => handleCleanUpAndClose(false)
  }
  function buildHandleCleanUpAndClose(): () => void {
    return handleCleanUpAndClose
  }
  function buildConfirmExit(): () => void {
    return confirmExit
  }
}
