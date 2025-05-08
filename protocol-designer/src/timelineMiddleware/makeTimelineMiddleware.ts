import isEqual from 'lodash/isEqual'

import {
  computeRobotStateTimelineRequest,
  computeRobotStateTimelineSuccess,
} from '../file-data/actions'
import { getInitialRobotState } from '../file-data/selectors'
import {
  getArgsAndErrorsByStepId,
  getInvariantContext,
  getOrderedStepIds,
} from '../step-forms/selectors'
import { getLabwareNamesByModuleId } from '../ui/modules/selectors'

import type { Middleware, MiddlewareAPI } from 'redux'
import type { ComputeRobotStateTimelineSuccessAction } from '../file-data/actions'
import type { Action, BaseState } from '../types'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'
import type { SubstepsArgsNoTimeline, WorkerResponse } from './types'

const hasChanged = (
  nextValues: { [key in any]?: any },
  memoizedValues: { [key in any]?: any }
): boolean =>
  Object.keys(nextValues).some(
    (selectorKey: string) =>
      !isEqual(nextValues[selectorKey], memoizedValues?.[selectorKey])
  )

const getTimelineArgs = (state: BaseState): GenerateRobotStateTimelineArgs => ({
  allStepArgsAndErrors: getArgsAndErrorsByStepId(state),
  orderedStepIds: getOrderedStepIds(state),
  invariantContext: getInvariantContext(state),
  initialRobotState: getInitialRobotState(state),
})

const getSubstepsArgs = (state: BaseState): SubstepsArgsNoTimeline => ({
  allStepArgsAndErrors: getArgsAndErrorsByStepId(state),
  orderedStepIds: getOrderedStepIds(state),
  invariantContext: getInvariantContext(state),
  initialRobotState: getInitialRobotState(state),
  labwareNamesByModuleId: getLabwareNamesByModuleId(state),
})

export const makeTimelineMiddleware = (): Middleware => {
  const worker = new Worker(new URL('./worker', import.meta.url), {
    type: 'module',
  })

  let prevTimelineArgs: GenerateRobotStateTimelineArgs | null = null // caches results of dependent selectors, eg {[selectorIndex]: lastCachedSelectorValue}

  let prevSubstepsArgs: SubstepsArgsNoTimeline | null = null
  let prevSuccessAction: ComputeRobotStateTimelineSuccessAction | null = null

  const timelineNeedsRecompute = (
    state: BaseState,
    actionType: string
  ): boolean => {
    const nextSelectorResults = getTimelineArgs(state)

    if (prevTimelineArgs === null) {
      // initial call, must populate memoized value
      prevTimelineArgs = nextSelectorResults
      return true
    }

    const needsRecompute = hasChanged(nextSelectorResults, prevTimelineArgs)
    // update memoized values
    prevTimelineArgs = nextSelectorResults
    return needsRecompute || actionType === 'LOAD_FILE'
  }

  const substepsNeedsRecompute = (
    state: BaseState,
    actionType: string
  ): boolean => {
    if (prevSubstepsArgs === null) {
      // initial call, must populate memoized value
      prevSubstepsArgs = getSubstepsArgs(state)
      return true
    }

    const nextSubstepSelectorResults = getSubstepsArgs(state)
    const needsRecompute = hasChanged(
      nextSubstepSelectorResults,
      prevSubstepsArgs
    )
    prevSubstepsArgs = nextSubstepSelectorResults // update memoized value

    return needsRecompute || actionType === 'LOAD_FILE'
  }

  return (store: MiddlewareAPI) => {
    return next => {
      return (action: unknown) => {
        const typedAction = action as Action
        // call the next dispatch method in the middleware chain
        const returnValue = next(action)
        const nextState = store.getState() as BaseState
        const shouldRecomputeTimeline = timelineNeedsRecompute(
          nextState,
          typedAction.type
        )
        const shouldRecomputeSubsteps = substepsNeedsRecompute(
          nextState,
          typedAction.type
        )

        // TODO: how to stop re-assigning this event handler every middleware call? We need
        // the `next` fn, so we can't do it outside the middleware body
        worker.onmessage = e => {
          prevSuccessAction = computeRobotStateTimelineSuccess(
            e.data as WorkerResponse
          )
          next(prevSuccessAction)
        }

        if (shouldRecomputeTimeline) {
          next(computeRobotStateTimelineRequest())

          if (prevTimelineArgs !== null && prevSubstepsArgs !== null) {
            const timelineArgs: GenerateRobotStateTimelineArgs = prevTimelineArgs
            const substepsArgs: SubstepsArgsNoTimeline = prevSubstepsArgs
            worker.postMessage({
              needsTimeline: true,
              timelineArgs,
              substepsArgs,
            })
          } else {
            console.error(
              'something weird happened, prevTimelineArgs and prevSubstepsArgs should never be null here'
            )
          }
        } else if (shouldRecomputeSubsteps && prevSuccessAction) {
          // Timeline did not change, but a substeps-specific selector did
          if (prevTimelineArgs !== null && prevSubstepsArgs !== null) {
            worker.postMessage({
              needsTimeline: false,
              timeline: prevSuccessAction.payload.standardTimeline,
              substepsArgs: prevSubstepsArgs,
            })
          } else {
            console.error(
              'something weird happened, prevTimelineArgs and prevSubstepsArgs should never be null here'
            )
          }
        }

        return returnValue
      }
    }
  }
}
