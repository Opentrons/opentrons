import {
  A1_NOZZLE,
  A12_NOZZLE,
  ALL,
  B1_ADDRESSABLE_AREA,
  COLUMN,
  FLEX_ROBOT_TYPE,
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotType,
  getFlexSurroundingSlots,
  getModuleDef,
  getOt2SurroundingSlots,
  getPositionFromSlotId,
  getRobotDefFromRobotType,
  H1_NOZZLE,
  OT2_ROBOT_TYPE,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  QUADRANT,
  ROW,
  SINGLE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { EMPTY } from '../constants'
import { getPipetteCriticalPoint } from './getPipetteCriticalPoint'
import { getFullStackFromLabwares, getSlotInLocationStack } from './misc'

import type {
  AddressableArea,
  CoordinateTuple,
  CutoutId,
  LabwareDefinition,
  ModuleModel,
  NozzleConfigurationStyle,
  OT2AddressableAreaName,
  PartialPrimaryNozzles,
  PipetteChannels,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntity,
  ModuleEntities,
  PipetteEntity,
  PipetteMovementSafetyStatus,
  Point,
  RobotState,
  TipState,
} from '../types'

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

const FULL_96_PIPETTE_NOZZLE_OFFSET_X_MM = 49.5 // designates half of full width of pipette nozzle plane for 96-ch pipettes

interface SlotInfo {
  addressableArea: AddressableArea | null
  position: CoordinateTuple | null
}

export const getCutoutFromSlot = (slotInfo: SlotInfo): CutoutId | null => {
  if (slotInfo.addressableArea?.areaType === 'slot') {
    const testCutoutId = `cutout${slotInfo.addressableArea?.id}`
    if (testCutoutId as CutoutId) {
      return testCutoutId as CutoutId
    }
  }
  return null
}

// return pipette bounds at a specific position
// note that this calculation is pessimistic to mirror behavior on protocol engine
// the returned plane is defined by the z-height of the empty nozzles (lowest case scenario)
// and the x-y bounds defined by the outer-most bounds of the pipette
const getPipetteBoundsAtSpecifiedMoveToPosition = (
  pipetteEntity: PipetteEntity,
  tipLength: number,
  wellTargetPoint: Point,
  labwareDefinition: LabwareDefinition,
  primaryNozzle: PrimaryNozzleConfigurationStyle,
  nozzleConfiguration: NozzleConfigurationStyle,
  tipOverlapOnNozzle: number
): Point[] => {
  const { pipetteBoundingBoxOffsets } = pipetteEntity.spec
  const primaryNozzlePoint = getPipetteCriticalPoint(
    nozzleConfiguration,
    pipetteEntity,
    primaryNozzle,
    labwareDefinition
  )
  const pipetteBoundingBoxLeftXOffset =
    pipetteBoundingBoxOffsets.backLeftCorner[0]
  const pipetteBoundingBoxRightXOffset =
    pipetteBoundingBoxOffsets.frontRightCorner[0]
  const pipetteBoundingBoxBackYOffset =
    pipetteBoundingBoxOffsets.backLeftCorner[1]
  const pipetteBoundingBoxFrontYOffset =
    pipetteBoundingBoxOffsets.frontRightCorner[1]
  const leftX =
    wellTargetPoint.x - (primaryNozzlePoint.x - pipetteBoundingBoxLeftXOffset)
  const rightX =
    wellTargetPoint.x + (pipetteBoundingBoxRightXOffset - primaryNozzlePoint.x)
  const backY =
    wellTargetPoint.y + (pipetteBoundingBoxBackYOffset - primaryNozzlePoint.y)
  const frontY =
    wellTargetPoint.y - (primaryNozzlePoint.y - pipetteBoundingBoxFrontYOffset)

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
  moduleModel: ModuleModel,
  robotType: RobotType
): number => {
  if (robotType === FLEX_ROBOT_TYPE) {
    const deckDef = getDeckDefFromRobotType(robotType)
    const { addressableAreas } = deckDef.locations
    const moduleAddressableArea = addressableAreas.find(addressableArea =>
      addressableArea.id.includes(moduleModel)
    )
    return moduleAddressableArea?.offsetFromCutoutFixture[2] ?? 0
  }
  // OT-2
  return getModuleDef(moduleModel).dimensions.bareOverallHeight
}

const getWasteChuteHeightFromDeckDefinition = (
  robotType: RobotType
): number => {
  const deckDef = getDeckDefFromRobotType(robotType)
  const wasteChute = Object.values(deckDef.cutoutFixtures).find(cutoutFixture =>
    WASTE_CHUTE_FIXTURES.includes(cutoutFixture.id)
  )
  return wasteChute?.height ?? 0 // returns 0 if no waste chute
}

//  check the highest Z-point of all items stacked given a deck slot (including modules,
//  adapters, waste chute, and modules on adapters)
const getHighestZInSlot = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  slotInfo: SlotInfo,
  robotType: RobotType
): number => {
  const { modules, labware } = robotState
  const { moduleEntities, labwareEntities, wasteChuteEntities } =
    invariantContext
  let totalHeight: number = 0
  const slotId = slotInfo?.addressableArea?.id
  if (slotId) {
    const largestLabwareStack = getFullStackFromLabwares(labware, slotId)
    const moduleInSlot = Object.keys(modules).find(
      moduleId => modules[moduleId].slot === slotId
    )
    const wasteChuteInSlot = Object.values(wasteChuteEntities).find(
      wasteChute => wasteChute.location === getCutoutFromSlot(slotInfo)
    )
    // if slot has waste chute
    if (wasteChuteInSlot) {
      totalHeight += getWasteChuteHeightFromDeckDefinition(robotType)
    }
    //  if slot has labware, includes labware, adapters, and module
    if (largestLabwareStack.length > 0) {
      largestLabwareStack.forEach(item => {
        if (modules[item] != null) {
          totalHeight += getModuleHeightFromDeckDefinition(
            moduleEntities[item].model,
            robotType
          )
        }
        if (labware[item] != null) {
          totalHeight += labwareEntities[item].def.dimensions.zDimension
        }
      })
      // if slot only has module
    } else if (moduleInSlot != null) {
      totalHeight += getModuleHeightFromDeckDefinition(
        moduleEntities[moduleInSlot].model,
        robotType
      )
    }
  }

  return totalHeight
}

//  check if the slot overlaps with the pipette position
const getSlotPotentialCollidingObject = (
  pipetteBounds: Point[],
  slotInfo: SlotInfo[],
  robotState: RobotState,
  invariantContext: InvariantContext,
  robotType: RobotType
): { addressableAreaCausingCollision: AddressableArea } | null => {
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
      const highestZInSurroundingSlot = getHighestZInSlot(
        robotState,
        invariantContext,
        slot,
        robotType
      )

      if (
        highestZInSurroundingSlot >= pipetteBounds[0]?.z &&
        slot.addressableArea != null
      ) {
        return { addressableAreaCausingCollision: slot.addressableArea }
      }
    }
  }
  return null
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
  hasTip: boolean
): Point => {
  const { wells } = labwareEntity.def
  //  getting location from the bottom of the well since PD only supports aspirate/dispense from bottom
  //  note: api includes calibration data here which PD does not have knowledge of at the moment
  const wellDef = wells[wellName]
  return {
    x: wellDef.x + wellLocationOffset.x,
    y: wellDef.y + wellLocationOffset.y,
    z: hasTip
      ? wellDef.z + (wellLocationOffset.z ?? 0)
      : labwareEntity.def.dimensions.zDimension,
  }
}

//  util to use in step-generation for if the pipette movement is safe
export const getPipetteMovementSafetyStatus = (args: {
  robotState: RobotState
  invariantContext: InvariantContext
  pipetteId: string
  labwareId: string
  wellLocationOffset?: Point
  wellTargetName?: string
  tiprackId?: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzleConfiguration: NozzleConfigurationStyle
}): PipetteMovementSafetyStatus => {
  const {
    robotState,
    invariantContext,
    pipetteId,
    labwareId,
    wellLocationOffset = { x: 0, y: 0, z: 0 },
    wellTargetName,
    primaryNozzle,
    nozzleConfiguration,
    tiprackId,
  } = args
  const {
    pipetteEntities,
    labwareEntities,
    stagingAreaEntities,
    moduleEntities,
  } = invariantContext
  const { labware: labwareState, tipState } = robotState

  const pipetteEntity = pipetteEntities[pipetteId]

  // if pipette entity is not found, return safe, since the responsibility of this function is to check if the pipette movement is safe, not to check if the pipette exists
  if (pipetteEntity == null) {
    return { isSafe: true }
  }

  const { spec: pipetteSpecs } = pipetteEntity
  const { channels } = pipetteSpecs

  // NOTE: I don't like this, but step-generation is currently blind to robot type, so we'll infer from the pipette specs
  const displayCategory = pipetteSpecs?.displayCategory
  const isFlexPipette = displayCategory === 'FLEX'
  const robotType = isFlexPipette ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE

  const deckDefinition = getDeckDefFromRobotType(robotType)
  //  early exit if labwareId is a trashBin or wasteChute or if no well name is provided or if 1ch pipette
  if (
    labwareEntities[labwareId] == null ||
    wellTargetName == null ||
    channels === 1
  ) {
    return { isSafe: true }
  }
  // If tiprackId is explicitly provided, assume the pipette currently has a tip attached.
  // This is used in WellSelector.ts / getAllWellsSafetyStatus to force "tip present"
  // during collision detection scenarios.
  const pipetteHasTip = tiprackId
    ? true
    : (tipState.pipettes[pipetteId]?.hasTip ?? false)

  // Use the provided tiprackId if available; otherwise fall back to the
  // tiprack recorded in tipState for this pipette.
  const confirmedTiprackId =
    tiprackId ?? tipState.pipettes[pipetteId]?.tiprackURI
  const tiprackEntity =
    confirmedTiprackId != null ? labwareEntities[confirmedTiprackId] : null
  const tiprackTipLength =
    tiprackEntity != null ? tiprackEntity.def.parameters.tipLength : 0
  const stagingAreaSlots = Object.values(stagingAreaEntities).map(
    stagingArea => stagingArea.location as string
  )

  // account for tip length if picking up tip
  const tipLength = pipetteHasTip ? (tiprackTipLength ?? 0) : 0
  const labwareSlot = getSlotInLocationStack(labwareState[labwareId].stack)

  const hasThermocycler = labwareState[labwareId].stack.some(item => {
    return moduleEntities[item]?.type === THERMOCYCLER_MODULE_TYPE
  })

  // special logic for thermocycler addressable area offset for the OT-2
  const flexDeckDefinition = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const addressableAreaOffset = (hasThermocycler
    ? getPositionFromSlotId(B1_ADDRESSABLE_AREA, flexDeckDefinition)
    : getPositionFromSlotId(labwareSlot, deckDefinition)) ?? [0, 0, 0]

  const thermocyclerOffset = hasThermocycler
    ? (flexDeckDefinition.locations.addressableAreas.find(
        addressableArea => addressableArea.id === THERMOCYCLER_MODULE_V2
      )?.offsetFromCutoutFixture ?? [0, 0, 0])
    : [0, 0, 0]
  const fullOffsetForThermocyclerAndAA: Point = {
    x: thermocyclerOffset[0] + addressableAreaOffset[0],
    y: thermocyclerOffset[1] + addressableAreaOffset[1],
    z: thermocyclerOffset[2] + addressableAreaOffset[2],
  }
  const { def: labwareDef } = labwareEntities[labwareId]
  const centeringOffset = getPipetteCenteringFullOffset({
    wellTargetName,
    primaryNozzle,
    nozzleConfiguration,
    specs: pipetteSpecs,
    labwareDef,
  })
  const fullWellLocationOffset = {
    x:
      wellLocationOffset.x +
      centeringOffset.x +
      fullOffsetForThermocyclerAndAA.x,
    y:
      wellLocationOffset.y +
      centeringOffset.y +
      fullOffsetForThermocyclerAndAA.y,
    z: (wellLocationOffset.z ?? 0) + (fullOffsetForThermocyclerAndAA.z ?? 0),
  }

  const wellTargetPoint = getWellPosition(
    labwareEntities[labwareId],
    wellTargetName,
    fullWellLocationOffset,
    pipetteHasTip
  )

  const tipOverlapOnNozzle =
    tiprackEntity != null
      ? getTipOverlap({
          pipetteSpecs,
          tiprackUri: tiprackEntity.labwareDefURI,
          nozzles: nozzleConfiguration,
        })
      : 0
  const labwareDefinition = labwareEntities[labwareId].def
  const pipetteBoundsAtWellLocation = getPipetteBoundsAtSpecifiedMoveToPosition(
    pipetteEntity,
    tipLength,
    wellTargetPoint,
    labwareDefinition,
    primaryNozzle,
    nozzleConfiguration,
    tipOverlapOnNozzle
  )

  const isWithinPipetteExtents = getIsMovementWithinDeckExtents({
    channels,
    boundingBox: pipetteBoundsAtWellLocation,
    robotType,
  })

  if (!isWithinPipetteExtents) {
    return { isSafe: false, reason: { type: 'outsidePipetteExtents' } }
  }
  const surroundingSlots =
    robotType === OT2_ROBOT_TYPE
      ? getOt2SurroundingSlots(labwareSlot as OT2AddressableAreaName)
      : getFlexSurroundingSlots(labwareSlot, stagingAreaSlots)
  const slotInfos: SlotInfo[] = surroundingSlots.map(slot => {
    const addressableArea = getAddressableAreaFromSlotId(slot, deckDefinition)
    const position = getPositionFromSlotId(slot, deckDefinition)
    return {
      addressableArea,
      position,
    }
  })
  if (
    getWillCollideWithThermocyclerLid(
      pipetteBoundsAtWellLocation,
      moduleEntities
    )
  ) {
    return {
      isSafe: false,
      reason: { type: 'thermocyclerLidCollision' },
    }
  }
  const slotPotentialCollidingObject = getSlotPotentialCollidingObject(
    pipetteBoundsAtWellLocation,
    slotInfos,
    robotState,
    invariantContext,
    robotType
  )
  if (slotPotentialCollidingObject != null) {
    return {
      isSafe: false,
      reason: {
        type: 'adjacentAdressableAreaCollision',
        addressableAreaCausingCollision:
          slotPotentialCollidingObject.addressableAreaCausingCollision,
      },
    }
  }
  return { isSafe: true }
}

interface TipPickupAvailability {
  isSafe: boolean
  isComplete?: boolean
}

export const getIsSafePickupWithinTiprack = (args: {
  tipState: Record<string, TipState>
  primaryNozzle: PrimaryNozzleConfigurationStyle
  channels: PipetteChannels
  nozzleConfiguration: NozzleConfigurationStyle
  wellName: string
  tiprackDef: LabwareDefinition
  tipsToIgnore?: string[]
}): TipPickupAvailability => {
  const {
    tipState,
    primaryNozzle,
    channels,
    nozzleConfiguration,
    wellName,
    tiprackDef,
    tipsToIgnore = [],
  } = args

  const { ordering } = tiprackDef

  if (channels === 1) {
    return { isSafe: true, isComplete: tipState[wellName] !== EMPTY }
  }
  if (channels === 8) {
    const shouldReverse = primaryNozzle !== A1_NOZZLE
    const columnIndex = getTipColumnIndex(wellName)
    const tipColumn = ordering[columnIndex]
    const tipColumnOrdered = shouldReverse
      ? [...tipColumn].reverse()
      : tipColumn
    if (nozzleConfiguration === SINGLE) {
      const targetWellIndex = tipColumnOrdered.indexOf(wellName)
      return {
        isSafe: tipColumnOrdered
          .slice(targetWellIndex + 1) // don't check the actual target well
          .every(
            well => tipState[well] === EMPTY || tipsToIgnore.includes(well)
          ),
        isComplete: tipState[wellName] !== EMPTY,
      }
    }
    if (nozzleConfiguration === PARTIAL_COLUMN) {
      const targetWellIndex = tipColumnOrdered.indexOf(wellName)
      const targetWellLength =
        PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
      // Active nozzle positions in the (possibly reversed) column ordering.
      // Reversed columns grow toward index 0 (H→G→F→...) so active wells are
      // slice(targetWellIndex - count + 1, targetWellIndex + 1).
      // Non-reversed (A1 primary) columns grow toward higher indices so active
      // wells are slice(targetWellIndex, targetWellIndex + count).
      const activeWells = shouldReverse
        ? tipColumnOrdered.slice(
            targetWellIndex - targetWellLength + 1,
            targetWellIndex + 1
          )
        : tipColumnOrdered.slice(
            targetWellIndex,
            targetWellIndex + targetWellLength
          )
      return {
        isSafe: tipColumnOrdered
          .slice(targetWellIndex + 1)
          .every(
            well => tipState[well] === EMPTY || tipsToIgnore.includes(well)
          ),
        // All active nozzle wells must have tips AND must not be claimed by an
        // earlier selection in the same wizard session (tipsToIgnore).
        isComplete: activeWells.every(
          well => tipState[well] !== EMPTY && !tipsToIgnore.includes(well)
        ),
      }
    }
    // 8 channel pickup, full column
    return {
      isSafe: true,
      isComplete: tipColumnOrdered.every(well => tipState[well] !== EMPTY),
    }
  }

  // channels = 96, all nozzles configured
  if (nozzleConfiguration === ALL) {
    return {
      isSafe: true,
      isComplete: Object.keys(tiprackDef.wells).every(
        well => tipState[well] !== EMPTY
      ),
    }
  }
  // channels = 96, 8 nozzles configured
  if (nozzleConfiguration === COLUMN) {
    const shouldReverseColumns = primaryNozzle === A12_NOZZLE
    const columnIndex = getTipColumnIndex(wellName)
    const columnPreOrdering = ordering[columnIndex]

    const tipColumnsOrdered = shouldReverseColumns
      ? [...ordering].reverse()
      : ordering

    const targetColumnIndex = tipColumnsOrdered.indexOf(columnPreOrdering)
    return {
      isSafe: tipColumnsOrdered
        .slice(targetColumnIndex + 1) // don't check the actual target column
        .flat()
        .every(well => tipState[well] === EMPTY || tipsToIgnore.includes(well)),
      isComplete: tipColumnsOrdered[targetColumnIndex].every(
        well => tipState[well] !== EMPTY
      ),
    }
  }
  // channels = 96, ROW configured
  if (nozzleConfiguration === ROW) {
    // build rows from column ordering
    const rowsPreOrdering = ordering[0].map((_, rowIndex) =>
      ordering.map(column => column[rowIndex])
    )
    const shouldReverse = primaryNozzle === H1_NOZZLE
    const tipRowsOrdered = shouldReverse
      ? [...rowsPreOrdering].reverse()
      : rowsPreOrdering
    const targetRowIndex = tipRowsOrdered.findIndex(row =>
      row.some(rowWell => rowWell === wellName)
    )
    return {
      isSafe: tipRowsOrdered
        .slice(targetRowIndex + 1)
        .flat()
        .every(well => tipState[well] === EMPTY || tipsToIgnore.includes(well)),
      isComplete: tipRowsOrdered[targetRowIndex].every(
        well => tipState[well] !== EMPTY
      ),
    }
  }
  // channels = 96, 1 nozzle configured
  if (nozzleConfiguration === SINGLE) {
    const primaryRowName = getTipRowName(
      primaryNozzle ??
        getDefaultPrimaryNozzle({ nozzles: nozzleConfiguration, channels })
    )
    const primaryColumnName = getTipColumnName(
      primaryNozzle ??
        getDefaultPrimaryNozzle({ nozzles: nozzleConfiguration, channels })
    )
    const shouldReverseRows = primaryRowName === 'H'
    const shouldReverseColumns = primaryColumnName === '12'
    const tipColumnsOrdered = shouldReverseColumns
      ? [...ordering].reverse()
      : ordering
    const targetColumnIndex = tipColumnsOrdered.findIndex(column =>
      column.some(columnWell => columnWell === wellName)
    )

    return {
      isSafe: tipColumnsOrdered.slice(targetColumnIndex).every(column => {
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
      }),
      isComplete: tipState[wellName] !== EMPTY,
    }
  }

  // should not hit
  return { isSafe: false }
}

export const getTipRowName = (wellName: string): string => wellName.slice(0, 1)

export const getTipColumnName = (wellName: string): string => wellName.slice(1)

export const getTipColumnIndex = (wellName: string): number =>
  parseInt(wellName.slice(1)) - 1

export const getDefaultPrimaryNozzle = (args: {
  nozzles: NozzleConfigurationStyle
  channels: PipetteChannels
}): PrimaryNozzleConfigurationStyle => {
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

export const getTargetTipsFromWellSets = (args: {
  wellSets: string[][]
  nozzles: NozzleConfigurationStyle
  channels: PipetteChannels
  primaryNozzle: string
}): string[] => {
  const { wellSets, nozzles, channels, primaryNozzle } = args
  if (nozzles === ROW) {
    return wellSets.map(row => row[0])
  }
  return wellSets.map(wellSet => {
    // 96-channel pipette with ALL nozzle configuration or 8ch with PARTIAL
    if (channels === 96 && nozzles === ALL) {
      return primaryNozzle
    }
    // 96- or 8-channel pipette with COLUMN nozzle configuration
    if (
      nozzles === COLUMN ||
      (channels === 8 && nozzles === ALL) ||
      (channels === 8 && nozzles === PARTIAL_COLUMN)
    ) {
      const shouldReverse = getTipRowName(primaryNozzle) === 'H'
      return shouldReverse ? wellSet[wellSet.length - 1] : wellSet[0]
    }
    // any pipette with SINGLE nozzle configuration
    console.assert(
      wellSet.length === 1,
      'Well set for SINGLE nozzle configuration should have exactly 1 well'
    )
    return wellSet[0]
  })
}

const getTipOverlap = (args: {
  pipetteSpecs: PipetteV2Specs
  tiprackUri: string
  nozzles: NozzleConfigurationStyle
}): number => {
  const { pipetteSpecs, tiprackUri, nozzles } = args
  const { channels } = pipetteSpecs
  const overlapKey = getOverlapKeyForPipetteSpecs(channels, nozzles)
  const tipOverlaps =
    pipetteSpecs.pickUpTipConfigurations.pressFit.configurationsByNozzleMap[
      overlapKey
    ]?.default.tipOverlaps

  // protect in case we get a bad overlap key
  if (tipOverlaps == null) {
    console.error(
      `No tip overlaps found for ${nozzles} and ${overlapKey} overlap.`
    )
    return 0
  }
  const maxVersion = Math.max(
    ...Object.keys(tipOverlaps).map(version => Number(version.slice(1)))
  )
  return (
    tipOverlaps[`v${maxVersion}`]?.[tiprackUri] ??
    tipOverlaps[`v${maxVersion}`]?.default ??
    0
  )
}

const getOverlapKeyForPipetteSpecs = (
  channels: PipetteChannels,
  nozzles: NozzleConfigurationStyle
): string => {
  if (channels === 1) {
    return 'SingleA1'
  }
  if (channels === 8) {
    return nozzles === SINGLE ? 'SingleH1' : 'Full'
  }
  if (channels === 96) {
    if (nozzles === SINGLE) {
      return 'SingleH12'
    } else if (nozzles === COLUMN) {
      return 'Column12'
    } else if (nozzles === ROW) {
      return 'RowA'
    }
  }
  // default
  return 'Full'
}

const getIsMovementWithinDeckExtents = (args: {
  channels: PipetteChannels
  boundingBox: Point[]
  robotType: RobotType
}): boolean => {
  const { channels, boundingBox, robotType } = args
  const robotDef = getRobotDefFromRobotType(robotType)
  const { paddingOffsets } = robotDef
  const { front, rear, leftSide, rightSide } = paddingOffsets
  const [xExtent, yExtent] = robotDef.extents
  const [backLeftBound, frontRightBound] = boundingBox
  const { x: pipetteLeftBound, y: pipetteBackBound } = backLeftBound
  const { x: pipetteRightBound, y: pipetteFrontBound } = frontRightBound

  if (channels === 96) {
    // check left
    if (pipetteRightBound < leftSide) {
      return false
    }
    // check right
    const rightLimit = xExtent + rightSide
    if (pipetteLeftBound > rightLimit) {
      return false
    }
  }

  // 8- and 96-channel pipettes
  if (channels !== 1) {
    // check front
    if (pipetteBackBound < front) {
      return false
    }
    // check rear
    const rearLimit = yExtent + rear
    if (pipetteFrontBound > rearLimit) {
      return false
    }
  }
  return true
}

// gets arbitrary span between two pipette nozzles, assuming constant grid spacing
const getNozzleGapFromPipetteSpecs = (specs: PipetteV2Specs): number => {
  const { channels, nozzleMap } = specs
  if (channels === 1) {
    return 0
  }

  // for 96- and 8-channel pipettes, the gap between nozzles A1 and B1
  // is consistent for all nozzles
  const [nozzleX1, nozzleX2] = ['A1', 'B1'].map(key => nozzleMap[key][1])
  const nozzleGap = Math.abs(nozzleX1 - nozzleX2)
  return nozzleGap
}

interface PipetteCenteringArgs {
  wellTargetName: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzleConfiguration: NozzleConfigurationStyle
  specs: PipetteV2Specs
  labwareDef: LabwareDefinition
}

export const getPipetteCenteringFullOffset = (
  args: PipetteCenteringArgs
): Point => {
  const centeringXOffset = getPipetteCenteringXOffset(args)
  const centeringYOffset = getPipetteCenteringYOffset(args)
  return {
    x: centeringXOffset,
    y: centeringYOffset,
  }
}

const getPipetteCenteringXOffset = (args: PipetteCenteringArgs): number => {
  const { primaryNozzle, nozzleConfiguration, specs, labwareDef } = args
  const { channels } = specs
  if (channels !== 96) {
    return 0
  }
  const { ordering } = labwareDef
  const shouldCenterInX = ordering.length === 1 // labware is comprised of 1 column (row-format, as an 8-ch reservoir)
  if (!shouldCenterInX) {
    return 0
  }
  let numNozzleColumns: number
  const directionForXOffset = getTipColumnName(primaryNozzle) === '12' ? 1 : -1
  if (
    (nozzleConfiguration === ALL && channels === 96) ||
    nozzleConfiguration === ROW
  ) {
    numNozzleColumns = 12
  } else if (nozzleConfiguration === QUADRANT) {
    numNozzleColumns = 6
  } else {
    return directionForXOffset * FULL_96_PIPETTE_NOZZLE_OFFSET_X_MM
  }
  const nozzleGap = getNozzleGapFromPipetteSpecs(specs)
  return shouldCenterInX
    ? (((numNozzleColumns - 1) * nozzleGap) / 2) * directionForXOffset
    : 0
}

const getPipetteCenteringYOffset = (args: PipetteCenteringArgs): number => {
  const {
    wellTargetName,
    primaryNozzle,
    nozzleConfiguration,
    specs,
    labwareDef,
  } = args
  const { channels } = specs
  if (channels === 1) {
    return 0
  }
  const nozzleGap = getNozzleGapFromPipetteSpecs(specs)
  const { ordering } = labwareDef
  const wellTargetColumnIndex = ordering.findIndex(column =>
    column.includes(wellTargetName)
  )
  const wellTargetColumn = ordering[wellTargetColumnIndex]
  if (wellTargetColumn.length !== 1) {
    return 0
  }
  if (nozzleConfiguration === PARTIAL_COLUMN) {
    // determine number of nozzle gaps between nozzle A and primary
    const spanFromAToPrimary =
      8 - PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]

    // shift forward such that nozzle A targets the well center
    const offsetToNozzleA = -1 * spanFromAToPrimary * nozzleGap

    // since there are 7 "gaps" between front and back nozzles
    const offsetFromNozzleAToBack = (7 * nozzleGap) / 2

    // "push" pipette back to center the pipette
    return offsetToNozzleA + offsetFromNozzleAToBack
  }

  // all other 96- and 8-channel nozzle configs
  const directionForYOffset = getTipRowName(primaryNozzle) === 'H' ? -1 : 1

  // 7 here again since there are 7 "gaps" between front and back nozzles
  return ((7 * nozzleGap) / 2) * directionForYOffset
}
