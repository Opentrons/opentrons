// @flow
import * as errorCreators from '../../errorCreators'
import {
  modulePipetteCollision,
  thermocyclerPipetteCollision,
} from '../../utils'
import type { MoveToWellParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV5'
import type { CommandCreator, CommandCreatorError } from '../../types'

/** Move to specified well of labware, with optional offset and pathing options. */
export const moveToWell: CommandCreator<MoveToWellParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette, labware, well, offset, minimumZHeight, forceDirect } = args

  const actionName = 'moveToWell'
  const errors: Array<CommandCreatorError> = []

  // TODO(2020-07-30, IL): the below is duplicated or at least similar
  // across aspirate/dispense/blowout, we can probably DRY it up
  const pipetteSpec = invariantContext.pipetteEntities[pipette]?.spec

  if (!pipetteSpec) {
    errors.push(errorCreators.pipetteDoesNotExist({ actionName, pipette }))
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(errorCreators.labwareDoesNotExist({ actionName, labware }))
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
    return { errors }
  }

  const params: MoveToWellParams = {
    pipette,
    labware,
    well,
    offset,
  }
  // add optional fields only if specified
  if (forceDirect != null) {
    params.forceDirect = forceDirect
  }
  if (minimumZHeight != null) {
    params.minimumZHeight = minimumZHeight
  }

  const commands = [
    {
      command: 'moveToWell',
      params,
    },
  ]

  return {
    commands,
  }
}
