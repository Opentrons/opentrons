import {
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotType,
  getFlexSurroundingSlots,
  getModuleDef2,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import type {
  AddressableArea,
  CoordinateTuple,
  NozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  RobotState,
  InvariantContext,
  PipetteEntity,
  ModuleEntities,
  LabwareEntity,
} from '../types'

const A12_column_front_left_bound = { x: -11.03, y: 2 }
const A12_column_back_right_bound = { x: 526.77, y: 506.2 }
const PRIMARY_NOZZLE = 'A12'
const NOZZLE_CONFIGURATION = 'COLUMN'
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
interface Point {
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
  primaryNozzle: string = 'A12'
): Point[] => {
  const {
    nozzleMap,
    nozzleOffset,
    pipetteBoundingBoxOffsets,
  } = pipetteEntity.spec
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

//  check the highest Z-point of all items stacked given a deck slot (including modules,
//  adapters, and modules on adapters)
const getHighestZInSlot = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  labwareId: string
): number => {
  const { modules, labware } = robotState
  const { moduleEntities, labwareEntities } = invariantContext
  if (modules[labwareId] != null) {
    const moduleDimensions = getModuleDef2(moduleEntities[labwareId].model)
      .dimensions
    return (
      //  labware + module
      labwareEntities[labwareId].def.dimensions.zDimension +
      moduleDimensions.bareOverallHeight +
      (moduleDimensions.lidHeight ?? 0)
    )
  } else if (labware[labwareId] != null) {
    const adapterId = labware[labwareId].slot
    if (labwareEntities[adapterId] != null) {
      if (modules[adapterId] != null) {
        const moduleDimensions = getModuleDef2(moduleEntities[adapterId].model)
          .dimensions
        return (
          //  labware + adapter + module
          labwareEntities[labwareId].def.dimensions.zDimension +
          labwareEntities[adapterId].def.dimensions.zDimension +
          moduleDimensions.bareOverallHeight +
          (moduleDimensions.lidHeight ?? 0)
        )
      } else {
        return (
          //   labware + adapter
          labwareEntities[labwareId].def.dimensions.zDimension +
          labwareEntities[adapterId].def.dimensions.zDimension
        )
      }
    } else {
      //   labware
      return labwareEntities[labwareId].def.dimensions.zDimension
    }
    //   shouldn't hit here!
  } else {
    console.error('something went wrong, this shoud not be hit')
    return 0
  }
}

//  check if the slot overlaps with the pipette position
const getSlotHasPotentialCollidingObject = (
  pipetteBounds: Point[],
  slotInfo: SlotInfo[],
  robotState: RobotState,
  invariantContext: InvariantContext,
  labwareId: string
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
      const surroundSlotLabwareId = Object.keys(robotState.labware).find(
        lwId => robotState.labware[lwId].slot === slot.addressableArea?.id
      )
      const highestZInSurroundingSlot =
        surroundSlotLabwareId != null
          ? getHighestZInSlot(
              robotState,
              invariantContext,
              surroundSlotLabwareId
            )
          : 0

      console.log({
        highestZInSurroundingSlot,
        pipetteBounds,
        slot: slot.addressableArea?.id,
      })
      return highestZInSurroundingSlot >= pipetteBounds[0]?.z
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
  addressableAreaOffset: CoordinateTuple | null
): Point => {
  const { wells } = labwareEntity.def
  //  getting location from the bottom of the well since PD only supports aspirate/dispense from bottom
  //  note: api includes calibration data here which PD does not have knowledge of at the moment
  const wellDef = wells[wellName]
  return {
    x: wellDef.x + wellLocationOffset.x + (addressableAreaOffset?.[0] ?? 0),
    y: wellDef.y + wellLocationOffset.y + (addressableAreaOffset?.[1] ?? 0),
    z:
      wellDef.z +
      (wellLocationOffset.z ?? 0) +
      (addressableAreaOffset?.[2] ?? 0),
  }
}

//  util to use in step-generation for if the pipette movement is safe
export const getIsSafePipetteMovement = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  pipetteId: string,
  labwareId: string,
  tipRackDefURI: string,
  wellLocationOffset: Point,
  wellTargetName?: string
): boolean => {
  const deckDefinition = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const {
    pipetteEntities,
    labwareEntities,
    additionalEquipmentEntities,
    moduleEntities,
  } = invariantContext
  const { labware: labwareState, tipState } = robotState

  //  early exit if labwareId is a trashBin or wasteChute
  if (labwareEntities[labwareId] == null || wellTargetName == null) {
    return true
  }

  const tiprackTipLength = Object.values(labwareEntities).find(
    labwareEntity => labwareEntity.labwareDefURI === tipRackDefURI
  )?.def.parameters.tipLength

  const stagingAreaSlots = Object.values(additionalEquipmentEntities)
    .filter(ae => ae.name === 'stagingArea')
    .map(stagingArea => stagingArea.location as string)
  const pipetteEntity = pipetteEntities[pipetteId]
  const pipetteHasTip = tipState.pipettes[pipetteId]
  const tipLength = pipetteHasTip ? tiprackTipLength ?? 0 : 0
  const labwareSlot = labwareState[labwareId].slot
  const addressableAreaOffset = getPositionFromSlotId(
    labwareSlot,
    deckDefinition
  )
  const wellTargetPoint = getWellPosition(
    labwareEntities[labwareId],
    wellTargetName,
    wellLocationOffset,
    addressableAreaOffset
  )

  const isWithinPipetteExtents = getIsWithinPipetteExtents(
    wellTargetPoint,
    //  TODO(jr, 4/22/24): PD only supports A12 as a primary nozzle for now
    //  and only for 96-channel column pick up
    NOZZLE_CONFIGURATION,
    PRIMARY_NOZZLE
  )
  if (!isWithinPipetteExtents) {
    return false
  } else {
    const pipetteBoundsAtWellLocation = getPipetteBoundsAtSpecifiedMoveToPosition(
      pipetteEntity,
      tipLength,
      wellTargetPoint
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
        invariantContext,
        labwareId
      )
    )
  }
}
