import * as StepGeneration from '@opentrons/step-generation'
import type { MoveLiquidStepArgs } from './generateQuickTransferArgs'

export const createCommandCreatorFromStepArgs = (
  args: MoveLiquidStepArgs
): StepGeneration.CurriedCommandCreator | null => {
  if (args == null) {
    return null
  }

  switch (args.commandCreatorFnName) {
    case 'transfer': {
      return StepGeneration.curryCommandCreator(StepGeneration.transfer, args)
    }
    case 'consolidate': {
      return StepGeneration.curryCommandCreator(
        StepGeneration.consolidate,
        args
      )
    }
    case 'distribute': {
      return StepGeneration.curryCommandCreator(StepGeneration.distribute, args)
    }
  }
}
