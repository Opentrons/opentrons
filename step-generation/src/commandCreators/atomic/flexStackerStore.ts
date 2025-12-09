import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  getLabwareIdOnShuttle,
  labwareMatchesLabwareInHopper,
  uuid,
} from '../../utils'

import type { FlexStackerStoreCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerStore: CommandCreator<
  FlexStackerStoreCreateCommand['params']
> = (args, invariantContext, robotState) => {
  const { moduleId } = args
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const labwareId = flexStackerState?.labwareOnShuttle?.primaryLabwareId ?? null
  if (flexStackerState !== null && !getLabwareIdOnShuttle(flexStackerState)) {
    return {
      errors: [errorCreators.flexStackerShuttleEmpty()],
    }
  }

  if (
    labwareId !== null &&
    !labwareMatchesLabwareInHopper(
      labwareId,
      invariantContext,
      flexStackerState
    )
  ) {
    return {
      errors: [errorCreators.flexStackerLabwareTypeMismatch()],
    }
  }
  return {
    commands: [
      {
        commandType: 'flexStacker/store',
        key: uuid(),
        params: {
          moduleId,
          strategy: 'automatic', // hardcoding here, since 'manual' should only be used in error recovery
        },
      },
    ],
    python: `${pythonName}.store()`,
  }
}
