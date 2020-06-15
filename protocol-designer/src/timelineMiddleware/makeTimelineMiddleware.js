// @flow
import {
  getArgsAndErrorsByStepId,
  getOrderedStepIds,
  getInvariantContext,
} from '../step-forms/selectors'
import { getInitialRobotState } from '../file-data/selectors'
// import { getFeatureFlagData } from '../feature-flags/selectors' // TODO: break memoization w/ FF changes
import Worker from './worker'

import type { Middleware } from 'redux'
import type { Action, BaseState } from '../types'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'

// TODO: relate types to `generateRobotStateTimeline` args
// const getDependentSelectors = () => ({
//   getArgsAndErrorsByStepId,
//   getOrderedStepIds,
//   getInvariantContext,
//   getInitialRobotState,
//   getFeatureFlagData,
// })

const getSelectorResults = (
  state: BaseState
): GenerateRobotStateTimelineArgs => ({
  allStepArgsAndErrors: getArgsAndErrorsByStepId(state),
  orderedStepIds: getOrderedStepIds(state),
  invariantContext: getInvariantContext(state),
  initialRobotState: getInitialRobotState(state),
  // featureFlagData: getFeatureFlagData(state),
})

export const makeTimelineMiddleware: () => Middleware<
  BaseState,
  Action
> = () => {
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

    // const dependentSelectors = getDependentSelectors()
    // Object.keys(dependentSelectors).forEach((selectorKey: string) => {
    //   const selector = dependentSelectors[selectorKey]
    //   const prevSelectorValue = prevMemo[selectorKey]
    //   const newSelectorValue = selector(state)
    //   if (
    //     prevSelectorValue === undefined ||
    //     prevSelectorValue !== newSelectorValue
    //   ) {
    //     needsRecompute = true
    //   }
    //   prevMemo = { ...prevMemo, [selectorKey]: newSelectorValue }
    // })
    // return needsRecompute
  }

  return ({ getState, dispatch }) => next => action => {
    // call the next dispatch method in the middleware chain
    const returnValue = next(action)

    const nextState = getState()
    const shouldRecompute = timelineNeedsRecompute(nextState)

    console.log({
      nextState,
      shouldRecompute,
    })

    if (shouldRecompute) {
      next({ type: 'GET_ROBOT_STATE_TIMELINE_REQUEST' })

      worker.onmessage = e => {
        console.log('worker said', e.data)
        next({ type: 'GET_ROBOT_STATE_TIMELINE_SUCCESS', payload: e.data })
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
