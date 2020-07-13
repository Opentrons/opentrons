// @flow
import type { Substeps } from '../steplist/types'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'
import type { GenerateSubstepsArgs } from './generateSubsteps'
import type { Timeline } from '../step-generation'

// worker itself will spread the robotStateTimeline in
export type SubstepsArgsNoTimeline = $Diff<
  GenerateSubstepsArgs,
  { robotStateTimeline: any }
>

// Two types of message. Substep generation requires a timeline.
// - we don't have a timeline and need to generate timeline + substeps
// - we have a timeline, so we only need to generate substeps
export type WorkerCommandMessage =
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

export type WorkerResponse = {|
  standardTimeline: Timeline,
  substeps: Substeps,
|}
export type WorkerResponseEvent = {| data: WorkerResponse |}

export type TimelineWorker = {|
  onmessage: WorkerResponseEvent => void,
  postMessage: WorkerCommandMessage => void,
|}
