import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import { getLabwareIdOnHopper, getLabwareIdOnShuttle, uuid } from '../../utils'

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
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const labwareIdOnHopper = getLabwareIdOnHopper(labware, moduleLocation)
  const labwarePythonName = labwareEntities[labwareIdOnHopper]?.pythonName

  if (flexStackerState !== null && getLabwareIdOnShuttle(flexStackerState)) {
    return {
      errors: [errorCreators.flexStackerShuttleFull()],
    }
  }
  if (!labwareIdOnHopper) {
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
