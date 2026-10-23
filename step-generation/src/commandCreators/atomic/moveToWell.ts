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
  resolveBooleanRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  thermocyclerPipetteCollision,
  uuid,
} from '../../utils'

import type { CreateCommand, WellLocation } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  MoveToWellStepGenArgs,
  Point,
} from '../../types'

/** Move to specified well of labware, with optional offset and pathing options. */
export const moveToWell: CommandCreator<MoveToWellStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteEntities, labwareEntities, runtimeParameters } =
    invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const labwareId = resolveStringRuntimeValue(args.labwareId, runtimeParameters)
  const wellName = resolveStringRuntimeValue(args.wellName, runtimeParameters)
  const origin =
    args.wellLocation?.origin == null
      ? undefined
      : resolveStringRuntimeValue(args.wellLocation.origin, runtimeParameters)
  const offsetX =
    args.wellLocation?.offset?.x == null
      ? undefined
      : resolveNumericRuntimeValue(
          args.wellLocation.offset.x,
          runtimeParameters
        )
  const offsetY =
    args.wellLocation?.offset?.y == null
      ? undefined
      : resolveNumericRuntimeValue(
          args.wellLocation.offset.y,
          runtimeParameters
        )
  const offsetZ =
    args.wellLocation?.offset?.z == null
      ? undefined
      : resolveNumericRuntimeValue(
          args.wellLocation.offset.z,
          runtimeParameters
        )
  const minimumZHeight =
    args.minimumZHeight == null
      ? undefined
      : resolveNumericRuntimeValue(args.minimumZHeight, runtimeParameters)
  const forceDirect =
    args.forceDirect == null
      ? undefined
      : resolveBooleanRuntimeValue(args.forceDirect, runtimeParameters)
  const speed =
    args.speed == null
      ? undefined
      : resolveNumericRuntimeValue(args.speed, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (pipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.pipetteId })
    )
  }
  if (labwareId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.labwareId })
    )
  }
  if (wellName == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.wellName })
    )
  }
  if (args.wellLocation?.origin != null && origin == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.wellLocation.origin,
      })
    )
  }
  if (typeof args.wellLocation?.offset?.x === 'string' && offsetX == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.wellLocation.offset.x,
      })
    )
  }
  if (typeof args.wellLocation?.offset?.y === 'string' && offsetY == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.wellLocation.offset.y,
      })
    )
  }
  if (typeof args.wellLocation?.offset?.z === 'string' && offsetZ == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.wellLocation.offset.z,
      })
    )
  }
  if (typeof args.minimumZHeight === 'string' && minimumZHeight == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.minimumZHeight,
      })
    )
  }
  if (typeof args.forceDirect === 'string' && forceDirect == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.forceDirect,
      })
    )
  }
  if (typeof args.speed === 'string' && speed == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.speed })
    )
  }
  if (
    errors.length > 0 ||
    pipetteId == null ||
    labwareId == null ||
    wellName == null
  ) {
    return { errors }
  }
  const wellLocation: WellLocation | undefined =
    args.wellLocation == null
      ? undefined
      : {
          ...(origin != null
            ? { origin: origin as WellLocation['origin'] }
            : {}),
          ...(args.wellLocation.offset != null
            ? {
                offset: {
                  ...(typeof offsetX === 'number' ? { x: offsetX } : {}),
                  ...(typeof offsetY === 'number' ? { y: offsetY } : {}),
                  ...(typeof offsetZ === 'number' ? { z: offsetZ } : {}),
                },
              }
            : {}),
        }
  const actionName = 'moveToWell'
  const labwareState = prevRobotState.labware
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
  const wellPython =
    runtimeParameters[args.wellName] != null
      ? args.wellName
      : formatPyStr(wellName)
  const pythonWellLocation = formatPyWellLocation({
    ...(origin != null ? { origin: origin as WellLocation['origin'] } : {}),
    ...(args.wellLocation?.offset != null
      ? { offset: args.wellLocation.offset as WellLocation['offset'] }
      : {}),
  })

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
        ...(speed != null ? { speed } : {}),
      },
    },
  ]
  const pythonArgs = [
    `${labwarePythonName}[${wellPython}]${pythonWellLocation}`,
  ]
  if (typeof args.forceDirect === 'string') {
    pythonArgs.push(`force_direct=${args.forceDirect}`)
  } else if (args.forceDirect) {
    pythonArgs.push('force_direct=True')
  }
  if (args.minimumZHeight) {
    pythonArgs.push(`minimum_z_height=${args.minimumZHeight}`)
  }
  if (args.speed) {
    pythonArgs.push(`speed=${args.speed}`)
  }
  return {
    commands,
    python: `${pipettePythonName}.move_to(${pythonArgs.join(', ')})`,
  }
}
