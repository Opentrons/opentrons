import type { Timeline } from '@opentrons/step-generation'
import type { Substeps } from '../steplist/types'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'
import type { GenerateSubstepsArgs } from './generateSubsteps'
// worker itself will spread the robotStateTimeline in
export type SubstepsArgsNoTimeline = Omit<
  GenerateSubstepsArgs,
  'robotStateTimeline'
>
// Two types of message. Substep generation requires a timeline.
// - we don't have a timeline and need to generate timeline + substeps
// - we have a timeline, so we only need to generate substeps
export type WorkerCommandMessage =
  | {
      needsTimeline: true
      timelineArgs: GenerateRobotStateTimelineArgs
      substepsArgs: SubstepsArgsNoTimeline
    }
  | {
      needsTimeline: false
      timeline: Timeline
      substepsArgs: SubstepsArgsNoTimeline
    }
export interface WorkerCommandEvent {
  data: WorkerCommandMessage
}
export interface WorkerResponse {
  standardTimeline: Timeline
  substeps: Substeps
}
export interface WorkerResponseEvent {
  data: WorkerResponse
}
export interface WorkerContext {
  addEventListener: (
    arg0: 'message',
    arg1: (arg0: WorkerCommandEvent) => void
  ) => void
  postMessage: (arg0: WorkerResponse) => void
}
