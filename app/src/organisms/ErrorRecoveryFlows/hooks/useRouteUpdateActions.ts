import type { MutableRefObject } from 'react'
import { useRef, useCallback } from 'react'
import last from 'lodash/last'

import head from 'lodash/head'

import {
  INVALID,
  RECOVERY_MAP,
  STEP_ORDER,
  GRIPPER_MOVE_STEPS,
} from '../constants'
import type {
  IRecoveryMap,
  RecoveryRoute,
  RobotMovingRoute,
  RouteStep,
} from '../types'
import type { UseRecoveryTakeoverResult } from './useRecoveryTakeover'
import type { UseShowDoorInfoResult } from './useShowDoorInfo'

export interface GetRouteUpdateActionsParams {
  hasLaunchedRecovery: boolean
  toggleERWizAsActiveUser: UseRecoveryTakeoverResult['toggleERWizAsActiveUser']
  recoveryMap: IRecoveryMap
  setRecoveryMap: (recoveryMap: IRecoveryMap) => void
  doorStatusUtils: UseShowDoorInfoResult
}

export interface UseRouteUpdateActionsResult {
  /* Redirect to the previous step for the current route if it exists, otherwise redirects to the option selection route. */
  goBackPrevStep: () => Promise<void>
  /* Redirect to the next step for the current route if it exists, otherwise redirects to the option selection route. */
  proceedNextStep: () => Promise<void>
  /* Redirect to a specific route. If a step is supplied, proceed to that step if valid, otherwise proceed to the first step. */
  proceedToRouteAndStep: (
    route: RecoveryRoute,
    step?: RouteStep
  ) => Promise<void>
  /* Stashes the current map then sets the current map to robot in motion after validating the door is closed.
  Restores the map after motion completes. */
  handleMotionRouting: (
    inMotion: boolean,
    movingRoute?: RobotMovingRoute
  ) => Promise<void>
  /* Contains the recovery map prior to implicit redirection, if any. Example, if the user is on route A, step A, and the
  app implicitly navigates the user to route Z, step Z, the stashed map will contain route A, step A. */
  stashedMap: IRecoveryMap | null
  stashedMapRef: MutableRefObject<IRecoveryMap | null>
}

// Utilities related to routing within the error recovery flows.
export function useRouteUpdateActions(
  routeUpdateActionsParams: GetRouteUpdateActionsParams
): UseRouteUpdateActionsResult {
  const {
    recoveryMap,
    setRecoveryMap,
    doorStatusUtils,
  } = routeUpdateActionsParams
  const { route: currentRoute, step: currentStep } = recoveryMap
  const { OPTION_SELECTION, ROBOT_IN_MOTION, ROBOT_DOOR_OPEN } = RECOVERY_MAP
  const { isDoorOpen } = doorStatusUtils
  const stashedMapRef = useRef<IRecoveryMap | null>(null)

  const goBackPrevStep = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { getPrevStep } = getRecoveryRouteNavigation(currentRoute)
      const updatedStep = getPrevStep(currentStep)

      return determineRecoveryRouting({
        currentRoute,
        updatedStep,
        ...routeUpdateActionsParams,
      }).then(() => {
        resolve()
      })
    })
  }, [currentStep, currentRoute, routeUpdateActionsParams])

  const proceedNextStep = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { getNextStep } = getRecoveryRouteNavigation(currentRoute)
      const updatedStep = getNextStep(currentStep)

      return determineRecoveryRouting({
        currentRoute,
        updatedStep,
        ...routeUpdateActionsParams,
      }).then(() => {
        resolve()
      })
    })
  }, [currentStep, currentRoute, routeUpdateActionsParams])

  const proceedToRouteAndStep = useCallback(
    (route: RecoveryRoute, step?: RouteStep): Promise<void> => {
      return new Promise((resolve, reject) => {
        const newFlowSteps = STEP_ORDER[route]

        let stepIdx = step != null ? newFlowSteps.indexOf(step) : 0
        stepIdx = stepIdx === -1 ? 0 : stepIdx // Route to first step if the supplied step is invalid.

        setRecoveryMap({ route, step: newFlowSteps[stepIdx] })
        resolve()
      })
    },
    []
  )

  // If the door is permitted on the current step, but the robot is about to move, we need to manually redirect users
  // to the door modal unless the step is specifically a gripper jaw release step.
  const checkDoorStatus = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isDoorOpen && !GRIPPER_MOVE_STEPS.includes(currentStep)) {
        stashedMapRef.current = { route: currentRoute, step: currentStep }

        setRecoveryMap({
          route: ROBOT_DOOR_OPEN.ROUTE,
          step: ROBOT_DOOR_OPEN.STEPS.DOOR_OPEN,
        })

        reject(
          new Error(
            'Cannot perform a command while the door is open. Routing to door open modal.'
          )
        )
      } else {
        resolve()
      }
    })
  }, [currentRoute, currentStep, isDoorOpen])

  const setRobotInMotion = useCallback(
    (inMotion: boolean, robotMovingRoute?: RobotMovingRoute): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (inMotion) {
          if (stashedMapRef.current == null) {
            stashedMapRef.current = { route: currentRoute, step: currentStep }
          }

          const route = robotMovingRoute ?? ROBOT_IN_MOTION.ROUTE
          const step =
            robotMovingRoute != null
              ? (head(STEP_ORDER[robotMovingRoute]) as RouteStep)
              : ROBOT_IN_MOTION.STEPS.IN_MOTION
          setRecoveryMap({ route, step })
        } else {
          if (stashedMapRef.current != null) {
            setRecoveryMap(stashedMapRef.current)
            stashedMapRef.current = null
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
    [currentRoute, currentStep]
  )

  const handleMotionRouting = (
    inMotion: boolean,
    robotMovingRoute?: RobotMovingRoute
  ): Promise<void> => {
    // Only check door status if we are fixin' to move.
    if (inMotion) {
      return checkDoorStatus().then(() =>
        setRobotInMotion(inMotion, robotMovingRoute)
      )
    } else {
      return setRobotInMotion(inMotion, robotMovingRoute)
    }
  }

  return {
    goBackPrevStep,
    proceedNextStep,
    proceedToRouteAndStep,
    handleMotionRouting,
    stashedMap: stashedMapRef.current,
    stashedMapRef: stashedMapRef,
  }
}

interface IRecoveryRouteNavigation {
  getNextStep: (step: RouteStep) => RouteStep | typeof INVALID
  getPrevStep: (step: RouteStep) => RouteStep | typeof INVALID
}

// Returns functions that calculate the next and previous steps of a route given a step.
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

type DetermineRecoveryRoutingParams = GetRouteUpdateActionsParams & {
  updatedStep: RouteStep
  currentRoute: RecoveryRoute
}

// Determine the valid recovery map given the current step.
// Because RunPausedSplash has access to some ER Wiz routes but is not a part of the ER wizard, the splash
// is the fallback route as opposed to SelectRecoveryOption (ex, accessed by pressing "go back" enough times).
function determineRecoveryRouting({
  hasLaunchedRecovery,
  toggleERWizAsActiveUser,
  setRecoveryMap,
  updatedStep,
  currentRoute,
}: DetermineRecoveryRoutingParams): Promise<void> {
  const { OPTION_SELECTION } = RECOVERY_MAP

  if (updatedStep === INVALID) {
    setRecoveryMap({
      route: OPTION_SELECTION.ROUTE,
      step: OPTION_SELECTION.STEPS.SELECT,
    })

    if (!hasLaunchedRecovery) {
      void toggleERWizAsActiveUser(false, false)
    }
  } else {
    setRecoveryMap({ route: currentRoute, step: updatedStep })
  }

  return Promise.resolve()
}
