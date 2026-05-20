import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { COLUMN_4_SLOTS } from '../../constants'
import * as errorCreators from '../../errorCreators'
import {
  absorbanceReaderCollision,
  formatPyStr,
  formatPyWellLocation,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerEastWestWithLatchOpen,
  getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette,
  getLabwareSlot,
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
  indentPyLines,
  modulePipetteCollision,
  pipetteAdjacentHeaterShakerWhileShaking,
  pipetteIntoHeaterShakerLatchOpen,
  pipetteIntoHeaterShakerWhileShaking,
  thermocyclerPipetteCollision,
  uuid,
} from '../../utils'

import type {
  CreateCommand,
  DispenseParams,
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError, Point } from '../../types'

export interface DispenseAtomicCommandParams extends DispenseParams {
  tipRack: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzles: NozzleConfigurationStyle
  isAirGap?: boolean
}
/** Dispense with given args. Requires tip. */
export const dispense: CommandCreator<DispenseAtomicCommandParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    pipetteId,
    volume,
    labwareId,
    wellName,
    flowRate,
    isAirGap,
    wellLocation,
    pushOut,
    primaryNozzle,
    nozzles,
  } = args
  const actionName = 'dispense'
  const labwareState = prevRobotState.labware
  const errors: CommandCreatorError[] = []
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId]?.spec
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

  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName,
        pipette: pipetteId,
        labware: labwareId,
        well: wellName,
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
    errors.push(errorCreators.pipettingIntoColumn4({ typeOfStep: actionName }))
  } else if (labwareState[slotName] != null) {
    const adapterSlot = getSlotInLocationStack(labwareState[slotName].stack)
    if (COLUMN_4_SLOTS.includes(adapterSlot)) {
      errors.push(
        errorCreators.pipettingIntoColumn4({ typeOfStep: actionName })
      )
    }
  }

  const isMultiChannelPipette =
    invariantContext.pipetteEntities[pipetteId]?.spec.channels !== 1

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
    primaryNozzle,
    nozzleConfiguration: nozzles,
  })
  if (isMultiChannelPipette && !pipetteMovementSafetyStatus.isSafe) {
    errors.push(
      errorCreators.possiblePipetteCollision({
        unsafePipetteMovementReason: pipetteMovementSafetyStatus.reason,
      })
    )
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
    absorbanceReaderCollision(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.absorbanceReaderLidClosed())
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
        invariantContext.labwareEntities[labwareId]
      )
    ) {
      errors.push(
        errorCreators.heaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette()
      )
    }
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
        pipetteId,
        volume,
        labwareId,
        wellName,
        wellLocation,
        flowRate,
        ...(pushOut != null ? { pushOut } : {}),
      },
      ...(isAirGap && { meta: { isAirGap } }),
    },
  ]

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const labwarePythonName =
    invariantContext.labwareEntities[labwareId].pythonName
  const pythonArgs = [
    `volume=${volume}`,
    `location=${labwarePythonName}[${formatPyStr(
      wellName
    )}]${formatPyWellLocation(wellLocation)}`,
    `flow_rate=${flowRate}`,
    // only pass push_out if it is not null
    ...(pushOut != null ? [`push_out=${pushOut}`] : []),
    // PAPI has no way to indicate that we're dispensing air, so we don't do anything
    // with the isAirGap parameter.
  ]
  const python = `${pipettePythonName}.dispense(\n${indentPyLines(
    pythonArgs.join(',\n')
  )},\n)`

  return {
    commands,
    python,
  }
}
