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
  type ComputeRobotStateTimelineSuccessAction,
} from '../file-data/actions'
import { getLabwareNamesByModuleId } from '../ui/modules/selectors'
// import { getFeatureFlagData } from '../feature-flags/selectors' // TODO: break memoization w/ FF changes
import Worker from './worker'

import type { Middleware } from 'redux'
import type { BaseState } from '../types'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'
import type { GenerateSubstepsArgs } from './generateSubsteps'
import type { Timeline } from '../step-generation'

type SubstepsArgsNoTimeline = $Diff<
  GenerateSubstepsArgs,
  { robotStateTimeline: any }
>

const getSelectorResults = (
  state: BaseState
): GenerateRobotStateTimelineArgs => ({
  allStepArgsAndErrors: getArgsAndErrorsByStepId(state),
  orderedStepIds: getOrderedStepIds(state),
  invariantContext: getInvariantContext(state),
  initialRobotState: getInitialRobotState(state),
  // featureFlagData: getFeatureFlagData(state),
})

type MemoSubsteps = $Diff<
  GenerateSubstepsArgs,
  {| ...GenerateRobotStateTimelineArgs, ...{| robotStateTimeline: any |} |}
>
const getSubstepSelectorResults = (state: BaseState): MemoSubsteps => ({
  labwareNamesByModuleId: getLabwareNamesByModuleId(state),
})

// Two types of message. Substep generation requires a timeline.
// - we don't have a timeline and need to generate timeline + substeps
// - we have a timeline, so we only need to generate substeps
type WorkerMessage =
  | {|
      timeline: null,
      timelineArgs: GenerateRobotStateTimelineArgs,
      substepsArgs: SubstepsArgsNoTimeline,
    |}
  | {|
      timeline: Timeline,
      timelineArgs: null,
      substepsArgs: SubstepsArgsNoTimeline,
    |}

// TODO(IL, 2020-06-15): once we create an Action union for PD, use that instead of `any` for Middleware<S, A>
export const makeTimelineMiddleware: () => Middleware<BaseState, any> = () => {
  const worker = new Worker()
  // worker is any-typed, so this fn provides a type-safe interface
  const postToWorker = (message: WorkerMessage): void =>
    worker.postMessage(message)

  let prevMemoTimeline: GenerateRobotStateTimelineArgs | null = null // caches results of dependent selectors, eg {[selectorIndex]: lastCachedSelectorValue}
  let prevMemoSubsteps: MemoSubsteps | null = null
  let cachedSuccessAction: ComputeRobotStateTimelineSuccessAction | null = null
  const timelineNeedsRecompute = (state: BaseState): boolean => {
    if (prevMemoTimeline === null) {
      // initial call, must populate memoized value
      prevMemoTimeline = getSelectorResults(state)
      return true
    }
    const nextSelectorResults = getSelectorResults(state)

    const needsRecompute = Object.keys(nextSelectorResults).some(
      (selectorKey: string) =>
        nextSelectorResults[selectorKey] !== prevMemoTimeline?.[selectorKey]
    )

    prevMemoTimeline = nextSelectorResults // update memoized value
    return needsRecompute
  }

  const substepsNeedsRecompute = (state: BaseState): boolean => {
    if (prevMemoSubsteps === null) {
      prevMemoSubsteps = getSubstepSelectorResults(state)
      return true
    }
    const nextSubstepSelectorResults = getSubstepSelectorResults(state)

    const needsRecompute = Object.keys(nextSubstepSelectorResults).some(
      (selectorKey: string) =>
        nextSubstepSelectorResults[selectorKey] !==
        prevMemoSubsteps?.[selectorKey]
    )

    prevMemoSubsteps = nextSubstepSelectorResults // update memoized value
    return needsRecompute
  }

  return ({ getState, dispatch }) => next => action => {
    // call the next dispatch method in the middleware chain
    const returnValue = next(action)

    const nextState = getState()
    const shouldRecomputeTimeline = timelineNeedsRecompute(nextState)
    const shouldRecomputeSubsteps = substepsNeedsRecompute(nextState)

    if (shouldRecomputeTimeline) {
      next(computeRobotStateTimelineRequest())
      worker.onmessage = e => {
        cachedSuccessAction = computeRobotStateTimelineSuccess(e.data)
        next(cachedSuccessAction)
      }

      if (prevMemoTimeline !== null && prevMemoSubsteps !== null) {
        const timelineArgs: GenerateRobotStateTimelineArgs = prevMemoTimeline
        const substepsArgs: SubstepsArgsNoTimeline = {
          ...prevMemoTimeline,
          ...prevMemoSubsteps,
        }
        postToWorker({ timeline: null, timelineArgs, substepsArgs })
      } else {
        console.error(
          'something weird happened, prevMemoTimeline and prevMemoSubsteps should never be null here'
        )
      }
    } else if (shouldRecomputeSubsteps && cachedSuccessAction) {
      // Timeline did not change, but a substeps-specific selector did
      if (prevMemoTimeline !== null && prevMemoSubsteps !== null) {
        postToWorker({
          timeline: cachedSuccessAction.payload.standardTimeline,
          timelineArgs: null,
          substepsArgs: { ...prevMemoTimeline, ...prevMemoSubsteps },
        })
      } else {
        console.error(
          'something weird happened, prevMemoTimeline and prevMemoSubsteps should never be null here'
        )
      }
    }

    return returnValue
  }
}
