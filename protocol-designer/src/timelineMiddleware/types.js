// @flow
import type { Substeps } from '../steplist/types'
import type { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline'
import type { GenerateSubstepsArgs } from './generateSubsteps'
import type { Timeline } from '../step-generation'

// worker itself will spread the robotStateTimeline in
export type SubstepsArgsNoTimeline = $Diff<
  GenerateSubstepsArgs,
  {| robotStateTimeline: mixed |}
>

// Two types of message. Substep generation requires a timeline.
// - we don't have a timeline and need to generate timeline + substeps
// - we have a timeline, so we only need to generate substeps
export type WorkerCommandMessage =
  | {|
      needsTimeline: true,
      timelineArgs: GenerateRobotStateTimelineArgs,
      substepsArgs: SubstepsArgsNoTimeline,
    |}
  | {|
      needsTimeline: false,
      timeline: Timeline,
      substepsArgs: SubstepsArgsNoTimeline,
    |}

export type WorkerCommandEvent = {| data: WorkerCommandMessage |}

export type WorkerResponse = {|
  standardTimeline: Timeline,
  substeps: Substeps,
|}
export type WorkerResponseEvent = {| data: WorkerResponse |}

export type TimelineWorker = {|
  onmessage: WorkerResponseEvent => void,
  postMessage: WorkerCommandMessage => void,
|}

export type WorkerContext = {|
  addEventListener: ('message', (WorkerCommandEvent) => void) => void,
  postMessage: WorkerResponse => void,
|}
