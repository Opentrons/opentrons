import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'
import type { CreateCommand, LabwareLocation, LabwareMovementStrategy } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError, MoveLabwareArgs } from '../../types'
/** Move to specified well of labware, with optional offset and pathing options. */
export const moveLabware: CommandCreator<MoveLabwareArgs> = (
  args,
  _invariantContext,
  prevRobotState
) => {
  const { labware, useGripper, newLocation } = args
  const actionName = 'moveToWell'
  const errors: CommandCreatorError[] = []

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware,
      })
    )
  }

  if (errors.length > 0) {
    return { errors }
  }

  const params = {
    labwareId: labware,
    strategy: useGripper ? 'usingGripper' : 'manualMoveWithPause' as LabwareMovementStrategy,
    newLocation: newLocation as LabwareLocation
  }

  const commands: CreateCommand[] = [
    {
      commandType: 'moveLabware',
      key: uuid(),
      params,
    },
  ]
  return {
    commands,
  }
}
