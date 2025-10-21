import {
  ALL,
  COLUMN,
  FLEX_ROBOT_TYPE,
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotType,
  getFlexSurroundingSlots,
  getPositionFromSlotId,
  SINGLE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { EMPTY } from '../constants'
import { getFullStackFromLabwares, getSlotInLocationStack } from './misc'

import type {
  AddressableArea,
  CoordinateTuple,
  LabwareDefinition,
  ModuleModel,
  NozzleConfigurationStyle,
  PipetteChannels,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntity,
  ModuleEntities,
  PipetteEntity,
  RobotState,
  TipState,
} from '../types'

const A12_column_front_left_bound = { x: -11.03, y: 2 }
const A12_column_back_right_bound = { x: 526.77, y: 506.2 }
export const PRIMARY_NOZZLE = 'A12'
const FLEX_TC_LID_COLLISION_ZONE = {
  back_left: { x: -43.25, y: 454.9, z: 211.91 },
  front_right: { x: 128.75, y: 402, z: 211.91 },
}
const FLEX_TC_LID_BACK_LEFT_PT = {
  x: FLEX_TC_LID_COLLISION_ZONE.back_left.x,
  y: FLEX_TC_LID_COLLISION_ZONE.back_left.y,
  z: FLEX_TC_LID_COLLISION_ZONE.back_left.z,
}

const FLEX_TC_LID_FRONT_RIGHT_PT = {
  x: FLEX_TC_LID_COLLISION_ZONE.front_right.x,
  y: FLEX_TC_LID_COLLISION_ZONE.front_right.y,
  z: FLEX_TC_LID_COLLISION_ZONE.front_right.z,
}

interface SlotInfo {
  addressableArea: AddressableArea | null
  position: CoordinateTuple | null
}
export interface Point {
  x: number
  y: number
  z?: number
}

//  check if nozzle(s) are inbounds
const getIsWithinPipetteExtents = (
  location: Point,
  nozzleConfiguration: NozzleConfigurationStyle,
  primaryNozzle: string
): boolean => {
  if (nozzleConfiguration === 'COLUMN' && primaryNozzle === 'A12') {
    const isWithinBounds =
      A12_column_front_left_bound.x <= location.x &&
      location.x <= A12_column_back_right_bound.x &&
      A12_column_front_left_bound.y <= location.y &&
      location.y <= A12_column_back_right_bound.y

    return isWithinBounds
  } else {
    // TODO: Handle other configurations such as 8-channel partial tip, and eventually all pipettes.
    return true
  }
}

// return pipette bounds at a sepcific position
// note that this calculation is pessimistic to mirror behavior on protocol engine
// the returned plane is defined by the z-height of the empty nozzles (lowest case scenario)
// and the x-y bounds defined by the outer-most bounds of the pipette
const getPipetteBoundsAtSpecifiedMoveToPosition = (
  pipetteEntity: PipetteEntity,
  tipLength: number,
  wellTargetPoint: Point,
  primaryNozzle: string
): Point[] => {
  const { nozzleMap, nozzleOffset, pipetteBoundingBoxOffsets } =
    pipetteEntity.spec
  const primaryNozzlePoint =
    nozzleMap == null || primaryNozzle == null
      ? nozzleOffset
      : nozzleMap[primaryNozzle]
  const pipetteBoundingBoxLeftXOffset =
    pipetteBoundingBoxOffsets.backLeftCorner[0]
  const pipetteBoundingBoxRightXOffset =
    pipetteBoundingBoxOffsets.frontRightCorner[0]
  const pipetteBoundingBoxBackYOffset =
    pipetteBoundingBoxOffsets.backLeftCorner[1]
  const pipetteBoundingBoxFrontYOffset =
    pipetteBoundingBoxOffsets.frontRightCorner[1]
  const leftX =
    wellTargetPoint.x - (primaryNozzlePoint[0] - pipetteBoundingBoxLeftXOffset)
  const rightX =
    wellTargetPoint.x + (pipetteBoundingBoxRightXOffset - primaryNozzlePoint[0])
  const backY =
    wellTargetPoint.y + (pipetteBoundingBoxBackYOffset - primaryNozzlePoint[1])
  const frontY =
    wellTargetPoint.y - (primaryNozzlePoint[1] - pipetteBoundingBoxFrontYOffset)

  const tipOverlapOnNozzle = 0
  const zNozzles = (wellTargetPoint.z ?? 0) + tipLength - tipOverlapOnNozzle

  const backLeftBound = { x: leftX, y: backY, z: zNozzles }
  const frontRightBound = { x: rightX, y: frontY, z: zNozzles }
  const backRightBound = { x: rightX, y: backY, z: zNozzles }
  const frontLeftBound = { x: leftX, y: frontY, z: zNozzles }
  return [backLeftBound, frontRightBound, backRightBound, frontLeftBound]
}

//  return whether the two provided rectangles are overlapping in the 2d space.
const getHasOverlappingRectangles = (
  rectangle1: Point[],
  rectangle2: Point[]
): boolean => {
  const oneLeftOfTwo = rectangle1[1].x < rectangle2[0].x
  const oneRightOfTwo = rectangle1[0].x > rectangle2[1].x
  const oneUnderTwo = rectangle1[0].y < rectangle2[1].y
  const oneOverTwo = rectangle1[1].y > rectangle2[0].y

  return !(oneLeftOfTwo || oneRightOfTwo || oneUnderTwo || oneOverTwo)
}

const getModuleHeightFromDeckDefinition = (
  moduleModel: ModuleModel
): number => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { addressableAreas } = deckDef.locations
  const moduleAddressableArea = addressableAreas.find(addressableArea =>
    addressableArea.id.includes(moduleModel)
  )
  return moduleAddressableArea?.offsetFromCutoutFixture[2] ?? 0
}

//  check the highest Z-point of all items stacked given a deck slot (including modules,
//  adapters, and modules on adapters)
const getHighestZInSlot = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  slotId: string
): number => {
  const { modules, labware } = robotState
  const { moduleEntities, labwareEntities } = invariantContext

  let totalHeight: number = 0
  const largestLabwareStack = getFullStackFromLabwares(labware, slotId)
  const moduleInSlot = Object.keys(modules).find(
    moduleId => modules[moduleId].slot === slotId
  )

  //  if slot has labware, includes labware, adapters, and module
  if (largestLabwareStack != null) {
    largestLabwareStack.forEach(item => {
      if (modules[item] != null) {
        totalHeight += getModuleHeightFromDeckDefinition(
          moduleEntities[item].model
        )
      }
      if (labware[item] != null) {
        totalHeight += labwareEntities[item].def.dimensions.zDimension
      }
    })
    // if slot only has module
  } else if (moduleInSlot != null) {
    totalHeight += getModuleHeightFromDeckDefinition(
      moduleEntities[moduleInSlot].model
    )
  }
  return totalHeight
}

//  check if the slot overlaps with the pipette position
const getSlotHasPotentialCollidingObject = (
  pipetteBounds: Point[],
  slotInfo: SlotInfo[],
  robotState: RobotState,
  invariantContext: InvariantContext
): boolean => {
  for (const slot of slotInfo) {
    const slotBounds = slot.addressableArea?.boundingBox
    const slotPosition = slot.position

    // If slotPosition or slotBounds is null, continue to the next iteration
    if (slotPosition == null || slotBounds == null) {
      continue
    }

    const backLeftCoords = {
      x: slotPosition[0],
      y: slotBounds.yDimension + slotPosition[1],
      z: slotPosition[2],
    }
    const frontRightCoords = {
      x: slotPosition[0] + slotBounds.xDimension,
      y: slotPosition[1],
      z: slotPosition[2],
    }
    // Check for overlapping rectangles and pipette z-coordinate if slot overlaps with pipette bounds
    if (
      getHasOverlappingRectangles(
        [pipetteBounds[0], pipetteBounds[1]],
        [backLeftCoords, frontRightCoords]
      ) &&
      pipetteBounds[0].z != null
    ) {
      const highestZInSurroundingSlot =
        slot.addressableArea?.id != null
          ? getHighestZInSlot(
              robotState,
              invariantContext,
              slot.addressableArea.id
            )
          : 0
      if (highestZInSurroundingSlot >= pipetteBounds[0]?.z) {
        return true
      }
    }
  }
  return false
}

const getWillCollideWithThermocyclerLid = (
  pipetteBounds: Point[],
  moduleEntities: ModuleEntities
): boolean => {
  if (
    Object.values(moduleEntities).find(
      module => module.type === THERMOCYCLER_MODULE_TYPE
    )
  ) {
    return (
      getHasOverlappingRectangles(
        [FLEX_TC_LID_BACK_LEFT_PT, FLEX_TC_LID_FRONT_RIGHT_PT],
        [pipetteBounds[0], pipetteBounds[1]]
      ) && pipetteBounds[0].x <= FLEX_TC_LID_BACK_LEFT_PT.z
    )
  } else {
    return false
  }
}

const getWellPosition = (
  labwareEntity: LabwareEntity,
  wellName: string,
  wellLocationOffset: Point,
  addressableAreaOffset: CoordinateTuple | null,
  hasTip: boolean
): Point => {
  const { wells } = labwareEntity.def
  //  getting location from the bottom of the well since PD only supports aspirate/dispense from bottom
  //  note: api includes calibration data here which PD does not have knowledge of at the moment
  const wellDef = wells[wellName]
  return {
    x: wellDef.x + wellLocationOffset.x + (addressableAreaOffset?.[0] ?? 0),
    y: wellDef.y + wellLocationOffset.y + (addressableAreaOffset?.[1] ?? 0),
    z: hasTip
      ? wellDef.z +
        (wellLocationOffset.z ?? 0) +
        (addressableAreaOffset?.[2] ?? 0)
      : labwareEntity.def.dimensions.zDimension,
  }
}

//  util to use in step-generation for if the pipette movement is safe
export const getIsSafePipetteMovement = (args: {
  robotState: RobotState
  invariantContext: InvariantContext
  pipetteId: string
  labwareId: string
  wellLocationOffset: Point
  wellTargetName?: string
  primaryNozzle?: string
  nozzleConfiguration?: NozzleConfigurationStyle
}): boolean => {
  const {
    robotState,
    invariantContext,
    pipetteId,
    labwareId,
    wellLocationOffset,
    wellTargetName,
    primaryNozzle: primaryNozzleOverride,
    nozzleConfiguration: nozzleConfigurationOverride,
  } = args
  const deckDefinition = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const {
    pipetteEntities,
    labwareEntities,
    stagingAreaEntities,
    moduleEntities,
  } = invariantContext
  const { labware: labwareState, tipState } = robotState

  const pipetteEntity = pipetteEntities[pipetteId]
  const nozzleConfiguration =
    nozzleConfigurationOverride ?? robotState.pipettes[pipetteId]?.nozzles

  //  early exit if labwareId is a trashBin or wasteChute or if no nozzle is provided
  if (
    labwareEntities[labwareId] == null ||
    wellTargetName == null ||
    nozzleConfiguration == null ||
    nozzleConfiguration === ALL
  ) {
    return true
  }

  const tiprackURI = tipState.pipettes[pipetteId]?.tiprackURI
  const tiprackEntityId =
    tiprackURI != null
      ? Object.keys(labwareEntities).find(lwKey => lwKey.includes(tiprackURI))
      : null
  const tiprackTipLength =
    tiprackEntityId != null
      ? labwareEntities[tiprackEntityId].def.parameters.tipLength
      : 0
  const stagingAreaSlots = Object.values(stagingAreaEntities).map(
    stagingArea => stagingArea.location as string
  )
  const pipetteHasTip = tipState.pipettes[pipetteId]?.hasTip ?? false
  // account for tip length if picking up tip
  const tipLength = pipetteHasTip ? (tiprackTipLength ?? 0) : 0
  const labwareSlot = getSlotInLocationStack(labwareState[labwareId].stack)
  const addressableAreaOffset = getPositionFromSlotId(
    labwareSlot,
    deckDefinition
  )
  const wellTargetPoint = getWellPosition(
    labwareEntities[labwareId],
    wellTargetName,
    wellLocationOffset,
    addressableAreaOffset,
    pipetteHasTip
  )

  const { channels } = pipetteEntity.spec
  const primaryNozzle =
    primaryNozzleOverride ??
    getDefaultPrimaryNozzle({
      nozzles: nozzleConfiguration,
      channels,
    })

  const isWithinPipetteExtents = getIsWithinPipetteExtents(
    wellTargetPoint,
    nozzleConfiguration,
    primaryNozzle
  )
  if (!isWithinPipetteExtents) {
    return false
  }
  const pipetteBoundsAtWellLocation = getPipetteBoundsAtSpecifiedMoveToPosition(
    pipetteEntity,
    tipLength,
    wellTargetPoint,
    primaryNozzle
  )
  const surroundingSlots = getFlexSurroundingSlots(
    labwareSlot,
    stagingAreaSlots
  )
  const slotInfos: SlotInfo[] = surroundingSlots.map(slot => {
    const addressableArea = getAddressableAreaFromSlotId(slot, deckDefinition)
    const position = getPositionFromSlotId(slot, deckDefinition)
    return {
      addressableArea,
      position,
    }
  })
  return (
    !getWillCollideWithThermocyclerLid(
      pipetteBoundsAtWellLocation,
      moduleEntities
    ) &&
    !getSlotHasPotentialCollidingObject(
      pipetteBoundsAtWellLocation,
      slotInfos,
      robotState,
      invariantContext
    )
  )
}

export const getIsSafePickupWithinTiprack = (args: {
  tipState: Record<string, TipState>
  primaryNozzle: string
  channels: PipetteChannels
  nozzleConfiguration: NozzleConfigurationStyle
  wellName: string
  tiprackDef: LabwareDefinition
  tipsToIgnore: string[]
}): boolean => {
  const {
    tipState,
    primaryNozzle,
    channels,
    nozzleConfiguration,
    wellName,
    tiprackDef,
    tipsToIgnore,
  } = args
  const { ordering } = tiprackDef
  if (channels === 1) {
    return true
  } else if (channels === 8) {
    if (nozzleConfiguration === SINGLE) {
      const shouldReverse = primaryNozzle === 'H1'
      const columnIndex = getTipColumnIndex(wellName)
      const tipColumn = ordering[columnIndex]
      const tipColumnOrdered = shouldReverse
        ? [...tipColumn].reverse()
        : tipColumn
      const targetWellIndex = tipColumnOrdered.indexOf(wellName)
      return tipColumnOrdered
        .slice(targetWellIndex + 1) // don't check the actual target well
        .every(well => tipState[well] === EMPTY || tipsToIgnore.includes(well))
    }
    return true
  }
  // channels === 96
  if (nozzleConfiguration === ALL) {
    return true
  } else if (nozzleConfiguration === COLUMN) {
    const shouldReverseColumns = primaryNozzle === 'A12'
    const columnIndex = getTipColumnIndex(wellName)
    const columnPreOrdering = ordering[columnIndex]
    const tipColumnsOrdered = shouldReverseColumns
      ? [...ordering].reverse()
      : ordering
    const targetColumnIndex = tipColumnsOrdered.indexOf(columnPreOrdering)
    return tipColumnsOrdered
      .slice(targetColumnIndex + 1) // don't check the actual target column
      .flat()
      .every(well => tipState[well] === EMPTY || tipsToIgnore.includes(well))
  } else if (nozzleConfiguration === SINGLE) {
    const primaryRowName = getTipRowName(primaryNozzle)
    const primaryColumnName = getTipColumnName(primaryNozzle)
    const shouldReverseRows = primaryRowName === 'H'
    const shouldReverseColumns = primaryColumnName === '12'
    const tipColumnsOrdered = shouldReverseColumns
      ? [...ordering].reverse()
      : ordering
    const targetColumnIndex = tipColumnsOrdered.findIndex(column =>
      column.some(columnWell => columnWell === wellName)
    )

    return tipColumnsOrdered.slice(targetColumnIndex).every(column => {
      const columnOrdered = shouldReverseRows ? [...column].reverse() : column
      const rowIndex = columnOrdered.findIndex(
        colWell => getTipRowName(colWell) === getTipRowName(wellName)
      )
      return columnOrdered.slice(rowIndex).every(
        well =>
          tipState[well] === EMPTY ||
          tipsToIgnore.includes(well) ||
          // need to include the well's own row and column, so ignore its own tip state
          well === wellName
      )
    })
  }
  return false
}

const getTipRowName = (wellName: string): string => wellName.slice(0, 1)

const getTipColumnName = (wellName: string): string => wellName.slice(1)

export const getTipColumnIndex = (wellName: string): number =>
  parseInt(wellName.slice(1)) - 1

export const getDefaultPrimaryNozzle = (args: {
  nozzles: NozzleConfigurationStyle
  channels: PipetteChannels
}): string => {
  const { nozzles, channels } = args
  if (channels === 8 && nozzles === SINGLE) {
    return 'H1'
  } else if (channels === 96) {
    if (nozzles === COLUMN) {
      return 'A12'
    } else if (nozzles === SINGLE) {
      return 'H12'
    }
  }
  return 'A1'
}
