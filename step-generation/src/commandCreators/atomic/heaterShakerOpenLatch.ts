import * as errorCreators from '../../errorCreators'
import {
  getIsTallLabwareEastWestOfHeaterShaker,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  HeaterShakerOpenLatchStepGenArgs,
} from '../../types'

const LEFT_SLOTS = ['1', '4', '7', '10']
export const heaterShakerOpenLatch: CommandCreator<
  HeaterShakerOpenLatchStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const {
    pipetteEntities,
    labwareEntities,
    moduleEntities,
    runtimeParameters,
  } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  if (moduleId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId }),
      ],
    }
  }
  const heaterShakerSlot = prevRobotState.modules[moduleId].slot
  const firstPipetteId = Object.keys(pipetteEntities)[0]
  const firstPipetteSpec = pipetteEntities[firstPipetteId]?.spec

  const isFlexPipette =
    (firstPipetteSpec?.displayCategory === 'FLEX' ||
      firstPipetteSpec?.channels === 96) ??
    false

  if (
    !isFlexPipette &&
    getIsTallLabwareEastWestOfHeaterShaker(
      prevRobotState.labware,
      labwareEntities,
      heaterShakerSlot
    )
  ) {
    // if H-S is in a left slot, labware must be to the right
    const leftOrRight = LEFT_SLOTS.includes(heaterShakerSlot) ? 'right' : 'left'
    return {
      errors: [errorCreators.tallLabwareEastWestOfHeaterShaker(leftOrRight)],
    }
  }
  const pythonName = moduleEntities[moduleId].pythonName

  return {
    commands: [
      {
        commandType: 'heaterShaker/openLabwareLatch',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.open_labware_latch()`,
  }
}
