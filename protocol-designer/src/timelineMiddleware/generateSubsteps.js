// @flow
import { generateSubsteps as generateSubstepsUtil } from '../steplist/generateSubsteps' // TODO(IL, 2020-06-29): disambiguate the 2 generateSubsteps fns, consider moving files around
import type {
  Timeline,
  RobotState,
  InvariantContext,
} from '../step-generation/types'
import type { StepArgsAndErrors, Substeps } from '../steplist/types'

export type GenerateSubstepsArgs = {|
  allStepArgsAndErrors: {
    [string]: StepArgsAndErrors,
    ...,
  }, // TODO IMMEDIATELY import this type, don't copy it. From stepFormSelectors.getArgsAndErrorsByStepId
  invariantContext: InvariantContext,
  orderedStepIds: Array<string>,
  robotStateTimeline: Timeline,
  initialRobotState: RobotState,
  labwareNamesByModuleId: {
    [moduleId: string]: ?{ nickname: ?string, displayName: string },
  }, // TODO IMMEDIATELY: import this type, don't copy it. From uiModulesSelectors.getLabwareNamesByModuleId,
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

    const substeps = generateSubstepsUtil(
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
