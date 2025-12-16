import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import { getLabwareIdOnShuttle, uuid } from '../../utils'

import type { FlexStackerRetrieveCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerRetrieve: CommandCreator<
  FlexStackerRetrieveCreateCommand['params']
> = (args, invariantContext, robotState) => {
  const { moduleId } = args
  const { moduleEntities } = invariantContext
  const modulePythonName = moduleEntities[moduleId].pythonName
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const isLabwareInHopper =
    flexStackerState?.labwareInHopper != null &&
    flexStackerState.labwareInHopper.length > 0

  if (flexStackerState !== null && getLabwareIdOnShuttle(flexStackerState)) {
    return {
      errors: [errorCreators.flexStackerShuttleFull()],
    }
  }
  if (!isLabwareInHopper) {
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
    python: `${modulePythonName}.retrieve()`,
  }
}
