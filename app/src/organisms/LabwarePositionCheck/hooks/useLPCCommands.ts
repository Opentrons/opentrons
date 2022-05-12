import { LabwarePositionCheckCreateCommand } from '../types'
import { useSteps } from './useSteps'

export function useLPCCommands(
  runId: string
): LabwarePositionCheckCreateCommand[] {
  return useSteps(runId).reduce<LabwarePositionCheckCreateCommand[]>(
    (steps, currentStep) => {
      return [...steps, ...currentStep.commands]
    },
    []
  )
}
