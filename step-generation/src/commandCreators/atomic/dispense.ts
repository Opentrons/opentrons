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
import type { DispenseParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { CommandCreator, CommandCreatorError } from '../../types'

/** Dispense with given args. Requires tip. */
export const dispense: CommandCreator<DispenseParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette, volume, labware, well, offsetFromBottomMm, flowRate } = args
  const actionName = 'dispense'
  const errors: CommandCreatorError[] = []
  const pipetteSpec = invariantContext.pipetteEntities[pipette]?.spec

  if (!pipetteSpec) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName,
        pipette,
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

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName,
        pipette,
        labware,
        well,
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

  const commands: CreateCommand[] = [
    {
      commandType: 'dispense',
      key: uuid(),
      params: {
        pipetteId: pipette,
        volume,
        labwareId: labware,
        wellName: well,
        wellLocation: {
          origin: 'bottom',
          offset: {
            z: offsetFromBottomMm,
          },
        },
        flowRate,
      },
    },
  ]
  return {
    commands,
  }
}
