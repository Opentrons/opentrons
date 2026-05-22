import { ALL, FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { COLUMN_4_SLOTS } from '../../constants'
import * as errorCreators from '../../errorCreators'
import {
  absorbanceReaderCollision,
  formatPyStr,
  formatPyWellLocation,
  getDefaultPrimaryNozzle,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerEastWestWithLatchOpen,
  getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette,
  getLabwareSlot,
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
  modulePipetteCollision,
  pipetteAdjacentHeaterShakerWhileShaking,
  pipetteIntoHeaterShakerLatchOpen,
  pipetteIntoHeaterShakerWhileShaking,
  thermocyclerPipetteCollision,
  uuid,
} from '../../utils'

import type { CreateCommand, MoveToWellParams } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError, Point } from '../../types'

/** Move to specified well of labware, with optional offset and pathing options. */
export const moveToWell: CommandCreator<MoveToWellParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    pipetteId,
    labwareId,
    wellName,
    wellLocation,
    minimumZHeight,
    forceDirect,
    speed,
  } = args
  const actionName = 'moveToWell'
  const errors: CommandCreatorError[] = []
  const labwareState = prevRobotState.labware

  const { pipetteEntities, labwareEntities } = invariantContext
  const pipetteSpec = pipetteEntities[pipetteId]?.spec
  const nozzleConfiguration = prevRobotState.pipettes[pipetteId]?.nozzles ?? ALL
  const primaryNozzle =
    prevRobotState.pipettes[pipetteId]?.primaryNozzle ??
    getDefaultPrimaryNozzle({
      nozzles: nozzleConfiguration,
      channels: pipetteSpec?.channels,
    })

  const isFlexPipette =
    (pipetteSpec?.displayCategory === 'FLEX' || pipetteSpec?.channels === 96) ??
    false

  const slotName = getLabwareSlot(labwareId, prevRobotState.labware)

  if (!pipetteSpec) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        pipette: pipetteId,
      })
    )
  }

  if (!labwareId || !prevRobotState.labware[labwareId]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware: labwareId,
      })
    )
  } else if (
    getSlotInLocationStack(prevRobotState.labware[labwareId].stack) ===
    'offDeck'
  ) {
    errors.push(errorCreators.labwareOffDeck())
  }

  if (COLUMN_4_SLOTS.includes(slotName)) {
    errors.push(
      errorCreators.pipettingIntoColumn4({ typeOfStep: 'move to well' })
    )
  } else if (labwareState[slotName] != null) {
    const adapterSlot = getSlotInLocationStack(labwareState[slotName].stack)
    if (COLUMN_4_SLOTS.includes(adapterSlot)) {
      errors.push(
        errorCreators.pipettingIntoColumn4({ typeOfStep: actionName })
      )
    }
  }

  if (
    modulePipetteCollision({
      pipette: pipetteId,
      labware: labwareId,
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
      labwareId
    )
  ) {
    errors.push(errorCreators.thermocyclerLidClosed())
  }

  if (
    pipetteIntoHeaterShakerLatchOpen(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.heaterShakerLatchOpen())
  }

  if (
    absorbanceReaderCollision(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.absorbanceReaderLidClosed())
  }

  if (
    pipetteIntoHeaterShakerWhileShaking(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.heaterShakerIsShaking())
  }
  if (
    pipetteAdjacentHeaterShakerWhileShaking(
      prevRobotState.modules,
      slotName,
      isFlexPipette ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
    )
  ) {
    errors.push(errorCreators.heaterShakerNorthSouthEastWestShaking())
  }
  if (!isFlexPipette) {
    if (
      getIsHeaterShakerEastWestWithLatchOpen(prevRobotState.modules, slotName)
    ) {
      errors.push(errorCreators.heaterShakerEastWestWithLatchOpen())
    }

    if (
      getIsHeaterShakerEastWestMultiChannelPipette(
        prevRobotState.modules,
        slotName,
        pipetteSpec
      )
    ) {
      errors.push(errorCreators.heaterShakerEastWestOfMultiChannelPipette())
    }

    if (
      getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette(
        prevRobotState.modules,
        slotName,
        pipetteSpec,
        labwareEntities[labwareId]
      )
    ) {
      errors.push(
        errorCreators.heaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette()
      )
    }
  }
  const isMultiChannelPipette =
    invariantContext.pipetteEntities[pipetteId]?.spec.channels !== 1
  const pipetteSpecs = invariantContext.pipetteEntities[pipetteId]?.spec

  const pipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
    robotState: prevRobotState,
    invariantContext,
    pipetteId,
    labwareId,
    wellLocationOffset: (wellLocation?.offset as Point) ?? {
      x: 0,
      y: 0,
      z: 0,
    },
    wellTargetName: wellName,
    nozzleConfiguration,
    primaryNozzle,
  })
  if (
    isMultiChannelPipette &&
    pipetteSpecs &&
    !pipetteMovementSafetyStatus.isSafe
  ) {
    errors.push(
      errorCreators.possiblePipetteCollision({
        unsafePipetteMovementReason: pipetteMovementSafetyStatus.reason,
      })
    )
  }
  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const pipettePythonName = pipetteEntities[pipetteId].pythonName
  const labwarePythonName = labwareEntities[labwareId].pythonName

  const commands: CreateCommand[] = [
    {
      commandType: 'moveToWell',
      key: uuid(),
      params: {
        pipetteId,
        labwareId,
        wellName,
        wellLocation,
        ...(forceDirect != null ? { forceDirect } : {}),
        ...(minimumZHeight != null ? { minimumZHeight } : {}),
        ...(speed != null ? { speed } : null),
      },
    },
  ]
  const pythonArgs = [
    `${labwarePythonName}[${formatPyStr(wellName)}]${formatPyWellLocation(
      wellLocation
    )}`,
    ...(forceDirect ? [`force_direct=True`] : []),
    ...(minimumZHeight ? [`minimum_z_height=${minimumZHeight}`] : []),
    ...(speed ? [`speed=${speed}`] : []),
  ]
  return {
    commands,
    python: `${pipettePythonName}.move_to(${pythonArgs.join(', ')})`,
  }
}
