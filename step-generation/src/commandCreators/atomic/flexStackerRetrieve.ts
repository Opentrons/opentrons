import * as errorCreators from '../../errorCreators'
import { getLabwareIdOnHopper, uuid } from '../../utils'

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
  const labwareIdOnModule = getLabwareIdOnHopper(labware, moduleLocation)
  const labwarePythonName = labwareEntities[labwareIdOnModule]?.pythonName
  // TODO: add error for if there is labware on the shuttle
  if (!labwareIdOnModule) {
    return {
      errors: [errorCreators.flexStackerHopperEmpty()],
    }
  }

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
