import * as errorCreators from '../../errorCreators'
import {
  modulePipetteCollision,
  thermocyclerPipetteCollision,
} from '../../utils'
import type { CreateCommand } from '@opentrons/shared-data'
import type { MoveToWellParams as v5MoveToWellParams } from '@opentrons/shared-data/protocol/types/schemaV5'
import type { MoveToWellParams as v6MoveToWellParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type { CommandCreator, CommandCreatorError } from '../../types'

/** Move to specified well of labware, with optional offset and pathing options. */
export const moveToWell: CommandCreator<v5MoveToWellParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette, labware, well, offset, minimumZHeight, forceDirect } = args
  const actionName = 'moveToWell'
  const errors: CommandCreatorError[] = []
  // TODO(2020-07-30, IL): the below is duplicated or at least similar
  // across aspirate/dispense/blowout, we can probably DRY it up
  const pipetteSpec = invariantContext.pipetteEntities[pipette]?.spec

  if (!pipetteSpec) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName,
        pipette,
      })
    )
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware,
      })
    )
  }

  if (
    modulePipetteCollision({
      pipette,
      labware,
      invariantContext,
      prevRobotState,
    })
  ) {
    errors.push(errorCreators.modulePipetteCollisionDanger())
  }

  if (
    thermocyclerPipetteCollision(
      prevRobotState.modules,
      prevRobotState.labware,
      labware
    )
  ) {
    errors.push(errorCreators.thermocyclerLidClosed())
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const params: v6MoveToWellParams = {
    pipetteId: pipette,
    labwareId: labware,
    wellName: well,
    wellLocation: {
      origin: 'bottom',
      offset,
    },
  }

  // add optional fields only if specified
  if (forceDirect != null) {
    params.forceDirect = forceDirect
  }

  if (minimumZHeight != null) {
    params.minimumZHeight = minimumZHeight
  }

  const commands: CreateCommand[] = [
    {
      commandType: 'moveToWell',
      params,
    },
  ]
  return {
    commands,
  }
}
