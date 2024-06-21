import { generateRobotStateTimeline } from './generateRobotStateTimeline'
import { generateSubsteps } from './generateSubsteps'
import type { Timeline } from '@opentrons/step-generation'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'
import type { GenerateSubstepsArgs } from './generateSubsteps'

type TimelineMessageEvent = MessageEvent<{
  needsTimeline: boolean
  timelineArgs: GenerateRobotStateTimelineArgs
  timeline: Timeline
  substepsArgs: GenerateSubstepsArgs
}>

addEventListener('message', (event: TimelineMessageEvent) => {
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
  postMessage(result)
})
