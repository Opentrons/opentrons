import * as React from 'react'
import { useTranslation } from 'react-i18next'

import type { RunCommandError } from '@opentrons/api-client'
import { AlertPrimaryButton, SPACING } from '@opentrons/components'

import type { ErrorDetails } from '.'
import { useChainMaintenanceCommands } from '../../resources/runs'
import { DROP_TIP_SPECIAL_ERROR_TYPES } from './constants'
import { SmallButton } from '../../atoms/buttons'

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

interface UseDropTipErrorComponentsProps {
  maintenanceRunId: string | null
  onClose: () => void
  errorDetails: ErrorDetails | null
  isOnDevice: boolean
}

/**
 * @description Returns special-cased components given an error type.
 */
export function useDropTipErrorComponents({
  maintenanceRunId,
  onClose,
  errorDetails,
  isOnDevice,
}: UseDropTipErrorComponentsProps): DropTipErrorComponents {
  const { t } = useTranslation('drop_tip_wizard')
  const { chainRunCommands } = useChainMaintenanceCommands()

  const genericSubHeader = (
    <>
      {t('drop_tip_failed')}
      <br />
      {errorDetails?.message}
    </>
  )

  const result: DropTipErrorComponents = {
    button: null,
    subHeader: genericSubHeader,
  }

  if (errorDetails?.type === DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR) {
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

    result.button = isOnDevice ? (
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
    )

    result.subHeader = <>{errorDetails.message}</>
  }

  return result
}
