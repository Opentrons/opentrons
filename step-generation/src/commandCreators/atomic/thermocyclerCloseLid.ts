import * as errorCreators from '../../errorCreators'
import {
  getTopLocationInStack,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  ThermocyclerCloseLidStepGenArgs,
} from '../../types'

export const thermocyclerCloseLid: CommandCreator<
  ThermocyclerCloseLidStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { moduleEntities, labwareEntities, runtimeParameters } =
    invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  if (moduleId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId }),
      ],
    }
  }
  const errors: CommandCreatorError[] = []

  const pythonName = moduleEntities[moduleId].pythonName
  const allLabwareOnModule = Object.values(prevRobotState.labware).filter(lw =>
    lw.stack.includes(moduleId)
  )
  const invalidLidStack = allLabwareOnModule.find(labware =>
    labware.stack.find(
      id =>
        labwareEntities[id]?.def.allowedRoles?.includes('lid') &&
        labwareEntities[id]?.def.parameters.loadName !==
          'opentrons_tough_pcr_auto_sealing_lid'
    )
  )
  const lidId =
    invalidLidStack != null
      ? getTopLocationInStack(invalidLidStack.stack)
      : null
  const lidDisplayName =
    lidId != null ? labwareEntities[lidId].def.metadata.displayName : null
  if (lidDisplayName != null) {
    errors.push(
      errorCreators.closingThermocyclerWithInvalidLid({
        lidDisplayName,
      })
    )
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  return {
    commands: [
      {
        commandType: 'thermocycler/closeLid',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.close_lid()`,
  }
}
