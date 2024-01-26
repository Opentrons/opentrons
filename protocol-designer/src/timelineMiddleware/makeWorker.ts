import { generateRobotStateTimeline } from './generateRobotStateTimeline'
import { generateSubsteps } from './generateSubsteps'
import { Timeline } from '@opentrons/step-generation'
import { WorkerContext } from './types'
// Since we can't type the worker.js itself (flow would not understand `new Worker()`),
// this typed wrapper is a trick to give us static type safety.
console.log('in makeworker.ts')
export const makeWorker = (context: WorkerContext): void => {
  console.log('in make worker function')
  context.addEventListener('message', event => {
    // NOTE: may have performance increase by not sending both
    // eg timelineArgs.initialRobotState and substepsArgs.initialRobotState
    const { data } = event
    console.log(data)
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
