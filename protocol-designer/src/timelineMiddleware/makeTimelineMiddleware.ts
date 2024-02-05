import {
  getArgsAndErrorsByStepId,
  getOrderedStepIds,
  getInvariantContext,
} from '../step-forms/selectors'
import { getInitialRobotState } from '../file-data/selectors'
import {
  computeRobotStateTimelineRequest,
  computeRobotStateTimelineSuccess,
  ComputeRobotStateTimelineSuccessAction,
} from '../file-data/actions'
import { getLabwareNamesByModuleId } from '../ui/modules/selectors'
import { Middleware } from 'redux'
import { BaseState } from '../types'
import { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'
import { SubstepsArgsNoTimeline } from './types'

const hasChanged = (
  nextValues: { [key in any]?: any },
  memoizedValues: { [key in any]?: any }
): boolean =>
  Object.keys(nextValues).some(
    (selectorKey: string) =>
      nextValues[selectorKey] !== memoizedValues?.[selectorKey]
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

// TODO(IL, 2020-06-15): once we create an Action union for PD, use that instead of `any` for Middleware<S, A>
export const makeTimelineMiddleware: () => Middleware<BaseState, any> = () => {
  const worker = new Worker(new URL('./worker', import.meta.url), {
    type: 'module',
  })

  console.log({ worker })

  let prevTimelineArgs: GenerateRobotStateTimelineArgs | null = null // caches results of dependent selectors, eg {[selectorIndex]: lastCachedSelectorValue}

  let prevSubstepsArgs: SubstepsArgsNoTimeline | null = null
  let prevSuccessAction: ComputeRobotStateTimelineSuccessAction | null = null

  const timelineNeedsRecompute = (state: BaseState): boolean => {
    const nextSelectorResults = getTimelineArgs(state)

    if (prevTimelineArgs === null) {
      // initial call, must populate memoized value
      prevTimelineArgs = nextSelectorResults
      return true
    }

    const needsRecompute = hasChanged(nextSelectorResults, prevTimelineArgs)
    // update memoized values
    prevTimelineArgs = nextSelectorResults
    return needsRecompute
  }

  const substepsNeedsRecompute = (state: BaseState): boolean => {
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

    return needsRecompute
  }

  return ({ getState, dispatch }) => next => action => {
    // call the next dispatch method in the middleware chain
    const returnValue = next(action)
    const nextState = getState()
    const shouldRecomputeTimeline = timelineNeedsRecompute(nextState)
    const shouldRecomputeSubsteps = substepsNeedsRecompute(nextState)

    // TODO: how to stop re-assigning this event handler every middleware call? We need
    // the `next` fn, so we can't do it outside the middleware body
    worker.onmessage = e => {
      prevSuccessAction = computeRobotStateTimelineSuccess(e.data)
      next(prevSuccessAction)
    }

    if (shouldRecomputeTimeline) {
      next(computeRobotStateTimelineRequest())

      if (prevTimelineArgs !== null && prevSubstepsArgs !== null) {
        const timelineArgs: GenerateRobotStateTimelineArgs = prevTimelineArgs
        const substepsArgs: SubstepsArgsNoTimeline = prevSubstepsArgs
        console.log('about to post worker message')
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
