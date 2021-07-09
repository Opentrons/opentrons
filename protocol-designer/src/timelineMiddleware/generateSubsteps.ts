import {
  Timeline,
  RobotState,
  InvariantContext,
} from '@opentrons/step-generation'
import { generateSubstepItem } from '../steplist/generateSubstepItem'
import {
  LabwareNamesByModuleId,
  StepArgsAndErrorsById,
  Substeps,
} from '../steplist/types'
export interface GenerateSubstepsArgs {
  allStepArgsAndErrors: StepArgsAndErrorsById
  invariantContext: InvariantContext
  orderedStepIds: string[]
  robotStateTimeline: Timeline
  initialRobotState: RobotState
  labwareNamesByModuleId: LabwareNamesByModuleId
}
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
    {
      robotState: initialRobotState,
    },
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
    return { ...acc, [stepId]: substeps }
  }, {})
}
