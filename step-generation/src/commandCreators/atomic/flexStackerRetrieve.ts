import { uuid } from '../../utils'

import type { FlexStackerRetrieveCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerRetrieve: CommandCreator<
  FlexStackerRetrieveCreateCommand['params']
> = (args, invariantContext) => {
  const { moduleId } = args
  const { moduleEntities } = invariantContext
  const modulePythonName = moduleEntities[moduleId].pythonName

  //  This stuff is probably needed for error creators so leaving it in here!
  // const moduleLocation = modules[moduleId].slot
  // const labwareIdOnModule = getLabwareIdOnHopper(labware, moduleLocation)
  // const labwarePythonName = labwareEntities[labwareIdOnModule]?.pythonName

  //  TODO: add error creator if there is no labware in the hopper

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
    python: `${modulePythonName}.retrieve()`,
  }
}
