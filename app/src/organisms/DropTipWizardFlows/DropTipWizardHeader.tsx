import { useTranslation } from 'react-i18next'

import { WizardHeader } from '@opentrons/components'

import type { ReactNode } from 'react'
import type { DropTipWizardProps } from './DropTipWizard'
import type { ErrorDetails } from './types'

type DropTipWizardHeaderProps = DropTipWizardProps & {
  isExitInitiated: boolean
  isFinalWizardStep: boolean
  confirmExit: () => void
  showConfirmExit: boolean
}

export function DropTipWizardHeader({
  confirmExit,
  isExitInitiated,
  isFinalWizardStep,
  errorDetails,
  dropTipCommands,
  showConfirmExit,
}: DropTipWizardHeaderProps): ReactNode {
  const { handleCleanUpAndClose } = dropTipCommands
  const { t, i18n } = useTranslation('drop_tip_wizard')

  const wizardHeaderOnExit = useWizardExitHeader({
    isFinalStep: isFinalWizardStep,
    hasInitiatedExit: isExitInitiated,
    errorDetails,
    confirmExit,
    handleCleanUpAndClose,
  })

  return (
    <WizardHeader
      title={i18n.format(t('drop_tips'), 'capitalize')}
      onExit={!showConfirmExit ? wizardHeaderOnExit : null}
    />
  )
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
    return () => {
      handleCleanUpAndClose(false)
    }
  }
  function buildHandleCleanUpAndClose(): () => void {
    return handleCleanUpAndClose
  }
  function buildConfirmExit(): () => void {
    return confirmExit
  }
}
