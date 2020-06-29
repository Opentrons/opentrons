import { generateRobotStateTimeline } from './generateRobotStateTimeline'
import { generateSubsteps } from './generateSubsteps'

self.addEventListener('message', event => {
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
