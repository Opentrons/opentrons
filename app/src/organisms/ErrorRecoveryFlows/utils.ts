import * as React from 'react'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
import head from 'lodash/head'

import { RECOVERY_MAP, ERROR_KINDS, INVALID, STEP_ORDER } from './constants'

import type {
  RouteStep,
  IRecoveryMap,
  RecoveryRoute,
  ErrorKind,
  RobotMovingRoute,
} from './types'

export function useErrorName(errorKind: ErrorKind): string {
  const { t } = useTranslation('error_recovery')

  switch (errorKind) {
    default:
      return t('general_error')
  }
}

// The generalized error message shown to the user in select locations.
export function useErrorMessage(errorKind: ErrorKind): string {
  const { t } = useTranslation('error_recovery')

  switch (errorKind) {
    default:
      return t('general_error_message')
  }
}

export function getErrorKind(errorType?: string): ErrorKind {
  switch (errorType) {
    default:
      return ERROR_KINDS.GENERAL_ERROR
  }
}

export interface GetRouteUpdateActionsParams {
  recoveryMap: IRecoveryMap
  setRecoveryMap: (recoveryMap: IRecoveryMap) => void
}
export interface UseRouteUpdateActionsResult {
  goBackPrevStep: () => void
  proceedNextStep: () => void
  proceedToRoute: (route: RecoveryRoute) => void
  setRobotInMotion: (inMotion: boolean, movingRoute?: RobotMovingRoute) => void
}
// Utilities related to routing within the error recovery flows.
export function useRouteUpdateActions({
  recoveryMap,
  setRecoveryMap,
}: GetRouteUpdateActionsParams): UseRouteUpdateActionsResult {
  const { route: currentRoute, step: currentStep } = recoveryMap
  const [stashedMap, setStashedMap] = React.useState<IRecoveryMap | null>(null)
  const { OPTION_SELECTION, ROBOT_IN_MOTION } = RECOVERY_MAP

  // Redirect to the previous step for the current route if it exists, otherwise redirects to the option selection route.
  const goBackPrevStep = React.useCallback((): void => {
    const { getPrevStep } = getRecoveryRouteNavigation(currentRoute)
    const updatedStep = getPrevStep(currentStep)

    if (updatedStep === INVALID) {
      setRecoveryMap({
        route: OPTION_SELECTION.ROUTE,
        step: OPTION_SELECTION.STEPS.SELECT,
      })
    } else {
      setRecoveryMap({ route: currentRoute, step: updatedStep })
    }
  }, [currentStep, currentRoute])

  // Redirect to the next step for the current route if it exists, otherwise redirects to the option selection route.
  const proceedNextStep = React.useCallback((): void => {
    const { getNextStep } = getRecoveryRouteNavigation(currentRoute)
    const updatedStep = getNextStep(currentStep)

    if (updatedStep === INVALID) {
      setRecoveryMap({
        route: OPTION_SELECTION.ROUTE,
        step: OPTION_SELECTION.STEPS.SELECT,
      })
    } else {
      setRecoveryMap({ route: currentRoute, step: updatedStep })
    }
  }, [currentStep, currentRoute])

  // Redirect to a specific route.
  const proceedToRoute = React.useCallback((route: RecoveryRoute): void => {
    const newFlowSteps = STEP_ORDER[route]

    setRecoveryMap({
      route,
      step: head(newFlowSteps) as RouteStep,
    })
  }, [])

  // Stashes the current map then sets the current map to robot in motion. Restores the map after motion completes.
  const setRobotInMotion = React.useCallback(
    (inMotion: boolean, robotMovingRoute?: RobotMovingRoute): void => {
      if (inMotion) {
        if (stashedMap == null) {
          setStashedMap({ route: currentRoute, step: currentStep })
        }
        const route = robotMovingRoute ?? ROBOT_IN_MOTION.ROUTE
        const step =
          robotMovingRoute != null
            ? (head(STEP_ORDER[robotMovingRoute]) as RouteStep)
            : ROBOT_IN_MOTION.STEPS.IN_MOTION

        setRecoveryMap({
          route,
          step,
        })
      } else {
        if (stashedMap != null) {
          setRecoveryMap(stashedMap)
          setStashedMap(null)
        } else {
          setRecoveryMap({
            route: OPTION_SELECTION.ROUTE,
            step: OPTION_SELECTION.STEPS.SELECT,
          })
        }
      }
    },
    [currentRoute, currentStep, stashedMap]
  )

  return { goBackPrevStep, proceedNextStep, proceedToRoute, setRobotInMotion }
}

interface IRecoveryRouteNavigation {
  getNextStep: (step: RouteStep) => RouteStep | typeof INVALID
  getPrevStep: (step: RouteStep) => RouteStep | typeof INVALID
}
export function getRecoveryRouteNavigation(
  route: RecoveryRoute
): IRecoveryRouteNavigation {
  const getNextStep = (step: RouteStep): RouteStep => {
    const routeSteps = STEP_ORDER[route]
    const isStepFinalStep = step === last(routeSteps)

    if (isStepFinalStep) {
      return INVALID
    } else {
      const stepIndex = routeSteps.indexOf(step)
      return stepIndex !== -1 ? routeSteps[stepIndex + 1] : INVALID
    }
  }

  const getPrevStep = (step: RouteStep): RouteStep | typeof INVALID => {
    const routeSteps = STEP_ORDER[route]
    const isStepFirstStep = step === head(routeSteps)

    if (isStepFirstStep) {
      return INVALID
    } else {
      const stepIndex = routeSteps.indexOf(step)
      return stepIndex !== -1 ? routeSteps[stepIndex - 1] : INVALID
    }
  }

  return { getNextStep, getPrevStep }
}
