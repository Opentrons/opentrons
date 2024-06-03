import * as React from 'react'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'
import last from 'lodash/last'

import { AlertPrimaryButton, SPACING } from '@opentrons/components'

import { DROP_TIP_SPECIAL_ERROR_TYPES, DT_ROUTES, INVALID } from './constants'
import { SmallButton } from '../../atoms/buttons'

import type { RunCommandError } from '@opentrons/shared-data'
import type { useChainMaintenanceCommands } from '../../resources/runs'
import type { DropTipFlowsRoute, DropTipFlowsStep } from './types'

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

// TOME: You'll want to split the utils into their own file most likely, but we'll see.

interface DropTipFlowsMap {
  currentRoute: DropTipFlowsRoute
  currentStep: DropTipFlowsStep
  currentStepIdx: number
}

export interface UseDropTipRoutingResult {
  /* The current step within DropTipWizard flows. */
  currentStep: DropTipFlowsStep
  /* The current route within DropTipWizard flows. */
  currentRoute: DropTipFlowsRoute
  /* The index of the current step within its route. */
  currentStepIdx: number
  /* Go back a step within the current route. Reroutes to "Before Beginning" if currently on the first step. */
  goBack: () => Promise<void>
  /* Proceed a step within the current route. Reroutes to "Before Beginning" if currently on the last step. */
  proceed: () => Promise<void>
  /* Proceed to the first step of a given route. */
  proceedToRoute: (route: DropTipFlowsRoute) => Promise<void>
}

/**
 * Returns utilities for managing Drop Tip wizard routing.
 *
 * DT Wiz consists of the following routes:
 * 1. Before Beginning - The primary user entry point from which other routes are selected.
 * 2. Blowout - Contains steps related to pipette blowout, which typically precedes the drop tip route.
 * 3. Drop Tip - Contains steps related to dropping the pipette tip. DT flows typically end after this step.
 */
export function useDropTipRouting(): UseDropTipRoutingResult {
  const [dropTipFlowsMap, setDropTipFlowsMap] = React.useState<DropTipFlowsMap>(
    {
      currentRoute: DT_ROUTES.BEFORE_BEGINNING,
      currentStep: head(DT_ROUTES.BEFORE_BEGINNING) as DropTipFlowsStep,
      currentStepIdx: 0,
    }
  )
  const { currentStep, currentRoute } = dropTipFlowsMap

  const goBack = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { getPrevStep } = getDropTipRouteNavigation(currentRoute)
      const { updatedStep, index } = getPrevStep(currentStep)
      const updatedValidRoute = determineValidRoute(
        updatedStep,
        dropTipFlowsMap
      )

      setDropTipFlowsMap(() => ({
        ...updatedValidRoute,
        currentStepIdx: index,
      }))

      resolve()
    })
  }

  const proceed = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { getNextStep } = getDropTipRouteNavigation(currentRoute)
      const { updatedStep, index } = getNextStep(currentStep)
      const updatedValidRoute = determineValidRoute(
        updatedStep,
        dropTipFlowsMap
      )

      setDropTipFlowsMap(() => ({
        ...updatedValidRoute,
        currentStepIdx: index,
      }))

      resolve()
    })
  }

  const proceedToRoute = (route: DropTipFlowsRoute): Promise<void> => {
    return new Promise((resolve, reject) => {
      setDropTipFlowsMap({
        currentRoute: route,
        currentStep: head(route) as DropTipFlowsStep,
        currentStepIdx: 0,
      })

      resolve()
    })
  }

  return { ...dropTipFlowsMap, goBack, proceed, proceedToRoute }
}

type DTStepOrInvalid = DropTipFlowsStep | typeof INVALID

interface StepNavigationResult {
  index: number
  updatedStep: DTStepOrInvalid
}

interface DropTipRouteNavigationResult {
  getNextStep: (step: DropTipFlowsStep) => StepNavigationResult
  getPrevStep: (step: DropTipFlowsStep) => StepNavigationResult
}

// Returns functions that calculate the next and previous steps of a route given a step.
function getDropTipRouteNavigation(
  route: DropTipFlowsStep[]
): DropTipRouteNavigationResult {
  const getNextStep = (step: DropTipFlowsStep): StepNavigationResult => {
    const isStepFinalStep = step === last(route)

    if (isStepFinalStep) {
      return { updatedStep: INVALID, index: 0 }
    } else {
      const stepIndex = route.indexOf(step)
      return {
        index: stepIndex + 1,
        updatedStep: stepIndex !== -1 ? route[stepIndex + 1] : INVALID,
      }
    }
  }

  const getPrevStep = (step: DropTipFlowsStep): StepNavigationResult => {
    const isStepFirstStep = step === head(route)

    if (isStepFirstStep) {
      return { updatedStep: INVALID, index: 0 }
    } else {
      const stepIndex = route.indexOf(step)
      return {
        index: stepIndex + 1,
        updatedStep: stepIndex !== -1 ? route[stepIndex - 1] : INVALID,
      }
    }
  }

  return { getNextStep, getPrevStep }
}
// TOME: You'll eventually do the INVALID override logic here, just like in
// ERFlows.

// Ensures that the updated step is a valid step, redirecting back to the
// first step of the "Before Beginning" route if the step is invalid.
function determineValidRoute(
  updatedStep: DropTipFlowsStep | typeof INVALID,
  dtFlowsMap: DropTipFlowsMap
): DropTipFlowsMap {
  if (updatedStep === INVALID) {
    return {
      currentRoute: DT_ROUTES.BEFORE_BEGINNING,
      currentStep: head(DT_ROUTES.BEFORE_BEGINNING) as DropTipFlowsStep,
      currentStepIdx: 0,
    }
  } else {
    return {
      ...dtFlowsMap,
      currentStep: updatedStep,
    }
  }
}
