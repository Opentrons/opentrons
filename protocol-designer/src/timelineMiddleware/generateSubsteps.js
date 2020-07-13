// @flow
import { generateSubstepItem } from '../steplist/generateSubstepItem'
import type {
  Timeline,
  RobotState,
  InvariantContext,
} from '../step-generation/types'
import type {
  LabwareNamesByModuleId,
  StepArgsAndErrorsById,
  Substeps,
} from '../steplist/types'

export type GenerateSubstepsArgs = {|
  allStepArgsAndErrors: StepArgsAndErrorsById,
  invariantContext: InvariantContext,
  orderedStepIds: Array<string>,
  robotStateTimeline: Timeline,
  initialRobotState: RobotState,
  labwareNamesByModuleId: LabwareNamesByModuleId,
|}

export const generateSubsteps = (args: GenerateSubstepsArgs): Substeps => {
  const {
    allStepArgsAndErrors,
    invariantContext,
    orderedStepIds,
    robotStateTimeline,
    initialRobotState,
    labwareNamesByModuleId,
  } = args
  // Add initial robot state frame, offsetting the timeline.
  // This is because substeps show the robot state just BEFORE their step has occurred
  const timeline = [
    { robotState: initialRobotState },
    ...robotStateTimeline.timeline,
  ]
  return orderedStepIds.reduce((acc: Substeps, stepId, timelineIndex) => {
    const robotState =
      timeline[timelineIndex] && timeline[timelineIndex].robotState

    const substeps = generateSubstepItem(
      allStepArgsAndErrors[stepId],
      invariantContext,
      robotState,
      stepId,
      labwareNamesByModuleId
    )

    return {
      ...acc,
      [stepId]: substeps,
    }
  }, {})
}
