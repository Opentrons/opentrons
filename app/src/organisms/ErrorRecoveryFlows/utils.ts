import * as React from 'react'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'
import last from 'lodash/last'
import findLast from 'lodash/findLast'

import { RUN_STATUS_AWAITING_RECOVERY } from '@opentrons/api-client'

import { useNotifyAllCommandsQuery } from '../../resources/runs'
import { RECOVERY_MAP, ERROR_KINDS, INVALID, STEP_ORDER } from './constants'

import type { RunStatus } from '@opentrons/api-client'
import type {
  RouteStep,
  IRecoveryMap,
  RecoveryRoute,
  ErrorKind,
  RobotMovingRoute,
  FailedCommand,
} from './types'

// TODO(jh, 05-09-24): Migrate utils, useRecoveryCommands.ts, and respective tests to a utils dir, and make each util a separate file.

// TODO(jh, 05-09-24): It is possible for a desktop app not to detect the most recently failed run command if there are
// too many FIXIT commands. See PR associated with TODO for explanation.

// While the run is "awaiting-recovery", return the most recently failed run command with a protocol intent.
// Otherwise, returns null.
const ALL_COMMANDS_POLL_MS = 5000

export function useCurrentlyFailedRunCommand(
  runId: string,
  runStatus: RunStatus | null
): FailedCommand | null {
  const [
    recentFailedCommand,
    setRecentFailedCommand,
  ] = React.useState<FailedCommand | null>(null)
  // The most recently failed protocol command causes the run to enter "awaiting-recovery", therefore only check
  // for a newly failed command when the run first enters "awaiting-recovery."
  const isRunStatusAwaitingRecovery = runStatus === RUN_STATUS_AWAITING_RECOVERY

  const { data: allCommandsQueryData } = useNotifyAllCommandsQuery(
    runId,
    null,
    {
      enabled: isRunStatusAwaitingRecovery && recentFailedCommand == null,
      refetchInterval: ALL_COMMANDS_POLL_MS,
    }
  )

  React.useEffect(() => {
    if (isRunStatusAwaitingRecovery && recentFailedCommand == null) {
      const failedCommand =
        findLast(
          allCommandsQueryData?.data,
          command => command.status === 'failed' && command.intent !== 'fixit'
        ) ?? null
      setRecentFailedCommand(failedCommand)
    } else if (!isRunStatusAwaitingRecovery && recentFailedCommand != null) {
      setRecentFailedCommand(null)
    }
  }, [isRunStatusAwaitingRecovery, recentFailedCommand, allCommandsQueryData])

  return recentFailedCommand
}

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
  goBackPrevStep: () => Promise<void>
  proceedNextStep: () => Promise<void>
  proceedToRoute: (route: RecoveryRoute) => Promise<void>
  setRobotInMotion: (
    inMotion: boolean,
    movingRoute?: RobotMovingRoute
  ) => Promise<void>
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
  const goBackPrevStep = React.useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
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

      resolve()
    })
  }, [currentStep, currentRoute])

  // Redirect to the next step for the current route if it exists, otherwise redirects to the option selection route.
  const proceedNextStep = React.useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
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

      resolve()
    })
  }, [currentStep, currentRoute])

  // Redirect to a specific route.
  const proceedToRoute = React.useCallback(
    (route: RecoveryRoute): Promise<void> => {
      return new Promise((resolve, reject) => {
        const newFlowSteps = STEP_ORDER[route]

        setRecoveryMap({
          route,
          step: head(newFlowSteps) as RouteStep,
        })

        resolve()
      })
    },
    []
  )

  // Stashes the current map then sets the current map to robot in motion. Restores the map after motion completes.
  const setRobotInMotion = React.useCallback(
    (inMotion: boolean, robotMovingRoute?: RobotMovingRoute): Promise<void> => {
      return new Promise((resolve, reject) => {
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

        resolve()
      })
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
