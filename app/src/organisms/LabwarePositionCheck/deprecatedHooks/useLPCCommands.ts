import { LabwarePositionCheckCreateCommand } from '../types'
import { useDeprecatedSteps } from './useDeprecatedSteps'

export function useLPCCommands(
  runId: string
): LabwarePositionCheckCreateCommand[] {
  return useDeprecatedSteps(runId).reduce<LabwarePositionCheckCreateCommand[]>(
    (steps, currentStep) => {
      return [...steps, ...currentStep.commands]
    },
    []
  )
}
