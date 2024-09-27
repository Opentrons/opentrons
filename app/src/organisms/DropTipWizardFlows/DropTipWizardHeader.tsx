import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { BEFORE_BEGINNING, BLOWOUT_SUCCESS, DT_ROUTES } from './constants'
import { WizardHeader } from '/app/molecules/WizardHeader'

import type { DropTipWizardProps } from './DropTipWizard'
import type { DropTipFlowsRoute, DropTipFlowsStep, ErrorDetails } from './types'

type DropTipWizardHeaderProps = DropTipWizardProps & {
  isExitInitiated: boolean
  isFinalWizardStep: boolean
  confirmExit: () => void
  showConfirmExit: boolean
}

export function DropTipWizardHeader({
  confirmExit,
  currentStep,
  currentRoute,
  currentStepIdx,
  isExitInitiated,
  isFinalWizardStep,
  errorDetails,
  dropTipCommands,
  showConfirmExit,
}: DropTipWizardHeaderProps): JSX.Element {
  const { handleCleanUpAndClose } = dropTipCommands
  const { t, i18n } = useTranslation('drop_tip_wizard')

  const wizardHeaderOnExit = useWizardExitHeader({
    isFinalStep: isFinalWizardStep,
    hasInitiatedExit: isExitInitiated,
    errorDetails,
    confirmExit,
    handleCleanUpAndClose,
  })

  const { totalSteps, currentStepNumber } = useSeenBlowoutSuccess({
    currentStep,
    currentRoute,
    currentStepIdx,
  })

  return (
    <WizardHeader
      title={i18n.format(t('drop_tips'), 'capitalize')}
      currentStep={currentStepNumber}
      totalSteps={totalSteps}
      onExit={!showConfirmExit ? wizardHeaderOnExit : null}
    />
  )
}

interface UseSeenBlowoutSuccessProps {
  currentStep: DropTipFlowsStep
  currentRoute: DropTipFlowsRoute
  currentStepIdx: number
}

interface UseSeenBlowoutSuccessResult {
  currentStepNumber: number | null
  totalSteps: number | null
}

// Calculate the props used for determining step count based on the route. Because blowout and drop tip are separate routes,
// there's a need for state to track whether we've seen blowout, so the step counter is accurate when the drop tip route is active.
export function useSeenBlowoutSuccess({
  currentStep,
  currentRoute,
  currentStepIdx,
}: UseSeenBlowoutSuccessProps): UseSeenBlowoutSuccessResult {
  const [hasSeenBlowoutSuccess, setHasSeenBlowoutSuccess] = useState(false)

  useEffect(() => {
    if (currentStep === BLOWOUT_SUCCESS) {
      setHasSeenBlowoutSuccess(true)
    } else if (currentStep === BEFORE_BEGINNING) {
      setHasSeenBlowoutSuccess(false)
    }
  }, [currentStep])

  const shouldRenderStepCounter = currentRoute !== DT_ROUTES.BEFORE_BEGINNING

  let totalSteps: null | number
  if (!shouldRenderStepCounter) {
    totalSteps = null
  } else if (currentRoute === DT_ROUTES.BLOWOUT || hasSeenBlowoutSuccess) {
    totalSteps = DT_ROUTES.BLOWOUT.length + DT_ROUTES.DROP_TIP.length
  } else {
    totalSteps = currentRoute.length
  }

  let currentStepNumber: null | number
  if (!shouldRenderStepCounter) {
    currentStepNumber = null
  } else if (hasSeenBlowoutSuccess && currentRoute === DT_ROUTES.DROP_TIP) {
    currentStepNumber = DT_ROUTES.BLOWOUT.length + currentStepIdx + 1
  } else {
    currentStepNumber = currentStepIdx + 1
  }

  return { currentStepNumber, totalSteps }
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
