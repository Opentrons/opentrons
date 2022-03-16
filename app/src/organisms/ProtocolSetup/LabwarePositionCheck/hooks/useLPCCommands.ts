import { LabwarePositionCheckCreateCommand } from '../types'
import { useSteps } from './useSteps'

export function useLPCCommands(): LabwarePositionCheckCreateCommand[] {
  return useSteps().reduce<LabwarePositionCheckCreateCommand[]>(
    (steps, currentStep) => {
      return [...steps, ...currentStep.commands]
    },
    []
  )
}
