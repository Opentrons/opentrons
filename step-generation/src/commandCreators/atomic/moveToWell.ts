import * as errorCreators from '../../errorCreators'
import {
  modulePipetteCollision,
  thermocyclerPipetteCollision,
  pipetteIntoHeaterShakerLatchOpen,
  pipetteIntoHeaterShakerWhileShaking,
  getIsHeaterShakerEastWestWithLatchOpen,
  pipetteAdjacentHeaterShakerWhileShaking,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette,
  uuid,
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

  if (
    pipetteIntoHeaterShakerLatchOpen(
      prevRobotState.modules,
      prevRobotState.labware,
      labware
    )
  ) {
    errors.push(errorCreators.heaterShakerLatchOpen())
  }

  if (
    pipetteIntoHeaterShakerWhileShaking(
      prevRobotState.modules,
      prevRobotState.labware,
      labware
    )
  ) {
    errors.push(errorCreators.heaterShakerIsShaking())
  }

  if (
    pipetteAdjacentHeaterShakerWhileShaking(
      prevRobotState.modules,
      prevRobotState.labware[labware]?.slot
    )
  ) {
    errors.push(errorCreators.heaterShakerNorthSouthEastWestShaking())
  }

  if (
    getIsHeaterShakerEastWestWithLatchOpen(
      prevRobotState.modules,
      prevRobotState.labware[labware]?.slot
    )
  ) {
    errors.push(errorCreators.heaterShakerEastWestWithLatchOpen())
  }

  if (
    getIsHeaterShakerEastWestMultiChannelPipette(
      prevRobotState.modules,
      prevRobotState.labware[labware]?.slot,
      pipetteSpec
    )
  ) {
    errors.push(errorCreators.heaterShakerEastWestOfMultiChannelPipette())
  }

  if (
    getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette(
      prevRobotState.modules,
      prevRobotState.labware[labware]?.slot,
      pipetteSpec,
      invariantContext.labwareEntities[labware]
    )
  ) {
    errors.push(
      errorCreators.heaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette()
    )
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const requiredParams: v6MoveToWellParams = {
    pipetteId: pipette,
    labwareId: labware,
    wellName: well,
  }

  const wellLocationParams: Pick<v6MoveToWellParams, 'wellLocation'> = {
    wellLocation: {
      origin: 'bottom',
      offset,
    },
  }

  const params = {
    ...requiredParams,
    ...(offset != null && wellLocationParams),
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
      key: uuid(),
      params,
    },
  ]
  return {
    commands,
  }
}
