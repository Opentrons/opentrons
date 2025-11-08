import * as errorCreators from '../../errorCreators'
import { getTopLocationInStack, uuid } from '../../utils'

import type { ModuleOnlyParams } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const thermocyclerCloseLid: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId } = args
  const { moduleEntities, labwareEntities } = invariantContext
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
