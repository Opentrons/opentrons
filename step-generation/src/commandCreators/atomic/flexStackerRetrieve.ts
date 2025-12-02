import { getLargestStackInSlot, uuid } from '../../utils'

import type { FlexStackerRetrieveCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerRetrieve: CommandCreator<
  FlexStackerRetrieveCreateCommand['params']
> = (args, invariantContext, robotState) => {
  const { moduleId } = args
  const { modules, labware } = robotState
  const { moduleEntities, labwareEntities } = invariantContext
  const modulePythonName = moduleEntities[moduleId].pythonName
  const moduleLocation = modules[moduleId].slot
  const largestStackInSlot = getLargestStackInSlot(labware, moduleLocation)
  // -4 to account for slot, Hopper const, and moduleId that occurs before it
  const labwareIdOnModule = largestStackInSlot[largestStackInSlot.length - 4]
  const labwarePythonName = labwareEntities[labwareIdOnModule]?.pythonName
  //  TODO: add error creator if there is no labware in the stack

  return {
    commands: [
      {
        commandType: 'flexStacker/retrieve',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${labwarePythonName} = ${modulePythonName}.retrieve()`,
  }
}
