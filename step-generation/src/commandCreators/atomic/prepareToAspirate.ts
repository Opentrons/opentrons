import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type { CommandCreator, PrepareToAspirateStepGenArgs } from '../../types'

export const prepareToAspirate: CommandCreator<PrepareToAspirateStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  if (pipetteId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({
          parameterName: args.pipetteId,
        }),
      ],
    }
  }
  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName

  const commands = [
    {
      commandType: 'prepareToAspirate' as const,
      key: uuid(),
      params: {
        pipetteId,
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.prepare_to_aspirate()`,
  }
}
