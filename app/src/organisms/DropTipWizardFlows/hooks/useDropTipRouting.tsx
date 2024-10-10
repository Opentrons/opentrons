import { useMemo, useState, useEffect } from 'react'
import head from 'lodash/head'
import last from 'lodash/last'

import { BEFORE_BEGINNING_STEPS, DT_ROUTES, INVALID } from '../constants'

import type {
  DropTipFlowsRoute,
  DropTipFlowsStep,
  FixitCommandTypeUtils,
} from '../types'

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
  /* Proceed to a given step of a given route or the first step of a given route if none is specified. */
  proceedToRouteAndStep: (
    route: DropTipFlowsRoute,
    step?: DropTipFlowsStep
  ) => Promise<void>
}

/**
 * Returns utilities for managing Drop Tip wizard routing.
 *
 * DT Wiz consists of the following routes:
 * 1. Before Beginning - The primary user entry point from which other routes are selected.
 * 2. Blowout - Contains steps related to pipette blowout, which typically precedes the drop tip route.
 * 3. Drop Tip - Contains steps related to dropping the pipette tip. DT flows typically end after this step.
 *
 * Note: Fixit commands have optional routing overrides for Drop Tip Wizard flows.
 */
export function useDropTipRouting(
  fixitUtils?: FixitCommandTypeUtils
): UseDropTipRoutingResult {
  const [initialRoute, initialStep] = useMemo(
    () => getInitialRouteAndStep(fixitUtils),
    []
  )

  const [dropTipFlowsMap, setDropTipFlowsMap] = useState<DropTipFlowsMap>({
    currentRoute: initialRoute as DropTipFlowsRoute,
    currentStep: initialStep,
    currentStepIdx: 0,
  })

  useReportMap(dropTipFlowsMap, fixitUtils)

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

  const proceedToRouteAndStep = (
    route: DropTipFlowsRoute,
    step?: DropTipFlowsStep
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // @ts-expect-error Step always valid or handled appropriately.
      const isStepNotInRoute = step != null && !route.includes(step)

      if (step == null || isStepNotInRoute) {
        setDropTipFlowsMap({
          currentRoute: route,
          currentStep: head(route) as DropTipFlowsStep,
          currentStepIdx: 0,
        })
        if (isStepNotInRoute) {
          console.error(`Step ${step} not found in route ${route}`)
        }
      } else {
        setDropTipFlowsMap({
          currentRoute: route,
          currentStep: step,
          // @ts-expect-error Step always valid or handled appropriately.
          currentStepIdx: route.indexOf(step),
        })
      }

      resolve()
    })
  }

  return { ...dropTipFlowsMap, goBack, proceed, proceedToRouteAndStep }
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
  route: readonly DropTipFlowsStep[]
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
        index: stepIndex - 1,
        updatedStep: stepIndex !== -1 ? route[stepIndex - 1] : INVALID,
      }
    }
  }

  return { getNextStep, getPrevStep }
}

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

// If an external flow is keeping track of the Drop tip flow map, update it when the drop tip flow map updates.
export function useReportMap(
  map: DropTipFlowsMap,
  fixitUtils?: FixitCommandTypeUtils
): void {
  const { currentStep, currentRoute } = map

  useEffect(() => {
    if (fixitUtils != null) {
      fixitUtils.reportMap({ route: currentRoute, step: currentStep })
    }
  }, [currentStep, currentRoute])
}

// If present, return fixit route overrides for setting the initial Drop Tip Wizard route.
export function getInitialRouteAndStep(
  fixitUtils?: FixitCommandTypeUtils
): [DropTipFlowsRoute, DropTipFlowsStep] {
  const routeOverride = fixitUtils?.routeOverride
  const initialRoute = routeOverride?.route ?? DT_ROUTES.BEFORE_BEGINNING
  const initialStep = routeOverride?.step ?? BEFORE_BEGINNING_STEPS[0]

  return [initialRoute, initialStep]
}
