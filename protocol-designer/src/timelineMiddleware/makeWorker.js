// @flow
import { generateRobotStateTimeline } from './generateRobotStateTimeline'
import { generateSubsteps } from './generateSubsteps'
import type { Timeline } from '../step-generation/types'
import type { WorkerContext } from './types'

// Since we can't type the worker.js itself (flow would not understand `new Worker()`),
// this typed wrapper is a trick to give us static type safety.
export const makeWorker = (context: WorkerContext): void => {
  context.addEventListener('message', event => {
    // NOTE: may have performance increase by not sending both
    // eg timelineArgs.initialRobotState and substepsArgs.initialRobotState
    const { data } = event

    const robotStateTimeline: Timeline = data.needsTimeline
      ? generateRobotStateTimeline(data.timelineArgs)
      : data.timeline

    const substeps = generateSubsteps({
      ...data.substepsArgs,
      robotStateTimeline,
    })

    const result = {
      standardTimeline: robotStateTimeline,
      substeps,
    }
    context.postMessage(result)
  })
}
