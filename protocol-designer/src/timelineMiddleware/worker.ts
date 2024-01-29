import { Timeline } from '@opentrons/step-generation'
import { generateRobotStateTimeline } from './generateRobotStateTimeline'
import { generateSubsteps } from './generateSubsteps'
addEventListener('message', event => {
  // NOTE: may have performance increase by not sending both
  // eg timelineArgs.initialRobotState and substepsArgs.initialRobotState
  const { data } = event
  console.log('got event')
  console.log({data})
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
  postMessage(result)
})
