import { generateRobotStateTimeline } from './generateRobotStateTimeline'
import { generateSubsteps } from './generateSubsteps'

self.addEventListener('message', event => {
  // NOTE: may have performance increase by not sending both
  // eg timelineArgs.initialRobotState and substepsArgs.initialRobotState
  const { timeline, timelineArgs, substepsArgs } = event.data

  const robotStateTimeline =
    timeline === null ? generateRobotStateTimeline(timelineArgs) : timeline
  const substeps = generateSubsteps({ ...substepsArgs, robotStateTimeline })

  const result = {
    standardTimeline: robotStateTimeline,
    substeps,
  }
  postMessage(result)
})
