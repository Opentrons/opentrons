// @flow
import {
  getArgsAndErrorsByStepId,
  getOrderedStepIds,
  getInvariantContext,
} from '../step-forms/selectors'
import { getInitialRobotState } from '../file-data/selectors'
import {
  computeRobotStateTimelineRequest,
  computeRobotStateTimelineSuccess,
} from '../file-data/actions'
// import { getFeatureFlagData } from '../feature-flags/selectors' // TODO: break memoization w/ FF changes
import Worker from './worker'

import type { Middleware } from 'redux'
import type { BaseState } from '../types'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'

const getSelectorResults = (
  state: BaseState
): GenerateRobotStateTimelineArgs => ({
  allStepArgsAndErrors: getArgsAndErrorsByStepId(state),
  orderedStepIds: getOrderedStepIds(state),
  invariantContext: getInvariantContext(state),
  initialRobotState: getInitialRobotState(state),
  // featureFlagData: getFeatureFlagData(state),
})

// TODO(IL, 2020-06-15): once we create an Action union for PD, use that instead of `any` for Middleware<S, A>
export const makeTimelineMiddleware: () => Middleware<BaseState, any> = () => {
  const worker = new Worker()
  let prevMemo: GenerateRobotStateTimelineArgs | null = null // caches results of dependent selectors, eg {[selectorIndex]: lastCachedSelectorValue}
  const timelineNeedsRecompute = (state: BaseState): boolean => {
    if (prevMemo === null) {
      // initial call, must populate memoized value
      prevMemo = getSelectorResults(state)
      return true
    }
    const nextSelectorResults = getSelectorResults(state)

    const needsRecompute = Object.keys(nextSelectorResults).some(
      (selectorKey: string) =>
        nextSelectorResults[selectorKey] !== prevMemo?.[selectorKey]
    )

    prevMemo = nextSelectorResults // update memoized value
    return needsRecompute
  }

  return ({ getState, dispatch }) => next => action => {
    // call the next dispatch method in the middleware chain
    const returnValue = next(action)

    const nextState = getState()
    const shouldRecompute = timelineNeedsRecompute(nextState)

    if (shouldRecompute) {
      next(computeRobotStateTimelineRequest())
      worker.onmessage = e => {
        next(computeRobotStateTimelineSuccess(e.data))
      }

      if (prevMemo !== null) {
        const args: GenerateRobotStateTimelineArgs = prevMemo
        worker.postMessage(args)
      } else {
        console.error(
          'something weird happened, prevMemo should not ever be null here'
        )
      }
    }

    return returnValue
  }
}
