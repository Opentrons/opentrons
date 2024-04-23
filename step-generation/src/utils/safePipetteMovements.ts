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
  pipetteEntity: PipetteEntity,
  location: Point,
  nozzleConfiguration: NozzleConfigurationStyle,
  primaryNozzle: string
): boolean => {
  const channels = pipetteEntity.spec.channels
  switch (channels) {
    case 96: {
      if (nozzleConfiguration === 'COLUMN' && primaryNozzle === 'A12') {
        return (
          A12_column_front_left_bound.x <= location.x &&
          location.x <= A12_column_back_right_bound.x &&
          A12_column_front_left_bound.y <= location.y &&
          location.y <= A12_column_back_right_bound.y
        )
      }
      break
    }
    case 8:
    case 1:
      //  TODO(jr, 4/22/24): update this to support 8-channel partial tip
      //  and eventually all pipettes
      return true
  }
}

//  return pipette bounds at a sepcific position
const getPipetteBoundsAtSpecifiedMoveToPosition = (
  primaryNozzle: string,
  pipetteEntity: PipetteEntity,
  tipLength: number,
  destinationPosition: Point
): Point[] => {
  const primaryNozzleOffset = pipetteEntity.spec.nozzleMap[primaryNozzle]
  const primaryNozzlePosition = {
    x: destinationPosition.x,
    y: destinationPosition.y + tipLength,
  }
  const pipetteBoundsOffsets = pipetteEntity.spec.pipetteBoundingBoxOffsets
  const backLeftBound = {
    x:
      primaryNozzlePosition.x -
      primaryNozzleOffset[0] +
      pipetteBoundsOffsets.backLeftCorner[0],
    y:
      primaryNozzlePosition.y -
      primaryNozzleOffset[1] +
      pipetteBoundsOffsets.backLeftCorner[1],
    z: primaryNozzleOffset[2] + pipetteBoundsOffsets.backLeftCorner[2],
  }
  const frontRightBound = {
    x:
      primaryNozzlePosition.x -
      primaryNozzleOffset[0] +
      pipetteBoundsOffsets.frontRightCorner[0],
    y:
      primaryNozzlePosition.y -
      primaryNozzleOffset[1] +
      pipetteBoundsOffsets.frontRightCorner[1],
    z: primaryNozzleOffset[2] + pipetteBoundsOffsets.frontRightCorner[2],
  }

  const backRightBound: Point = {
    x: backLeftBound.x,
    y: backLeftBound.y,
    z: frontRightBound.z,
  }
  const frontLeftBound: Point = {
    x: backLeftBound.x,
    y: frontRightBound.y,
    z: backLeftBound.z,
  }

  return [backLeftBound, frontRightBound, backRightBound, frontLeftBound]
}

//  return whether the two provided rectangles are overlapping in the 2d space.
const hasOverlappingRectangles = (
  rectangle1: Point[],
  rectangle2: Point[]
): boolean => {
  const xCoords = [
    rectangle1[0].x,
    rectangle1[1].x,
    rectangle2[0].x,
    rectangle2[1].x,
  ]
  const xLengthRect1 = Math.abs(rectangle1[1].x - rectangle1[0].x)
  const xLengthRect2 = Math.abs((rectangle2[1].x = rectangle2[0].x))
  const overlappingInX =
    Math.abs(Math.max(...xCoords) - Math.min(...xCoords)) <
    xLengthRect1 + xLengthRect2
  const yCoordinates = [
    rectangle1[0].y,
    rectangle1[1].y,
    rectangle2[0].y,
    rectangle2[1].y,
  ]
  const yLengthRect1 = Math.abs(rectangle1[1].y - rectangle1[0].y)
  const yLengthRect2 = Math.abs(rectangle2[1].y - rectangle2[0].y)
  const overlappingInY =
    Math.abs(Math.max(...yCoordinates) - Math.min(...yCoordinates)) <
    yLengthRect1 + yLengthRect2
  return overlappingInX && overlappingInY
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
const slotHasPotentialCollidingObject = (
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
      x: slotBounds.xDimension,
      y: slotBounds.yDimension,
      z: slotBounds.zDimension,
    }
    const frontRightCoords = {
      x: slotPosition[0],
      y: slotPosition[1],
      z: slotPosition[2],
    }

    // Check for overlapping rectangles and pipette z-coordinate if slot overlaps with pipette bounds
    if (
      hasOverlappingRectangles(
        [pipetteBounds[0], pipetteBounds[1]],
        [backLeftCoords, frontRightCoords]
      ) &&
      pipetteBounds[0].z != null
    ) {
      console.log('hit here')
      const highestZInSlot = getHighestZInSlot(
        robotState,
        invariantContext,
        labwareId
      )
      console.log('highestZInSlot', highestZInSlot, pipetteBounds)
      return highestZInSlot >= pipetteBounds[0]?.z
    }
  }
  return false
}

const getWillCollideWithThermocyclerLid = (
  pipetteBounds: Point[],
  slotInfos: SlotInfo[],
  moduleEntities: ModuleEntities
): boolean => {
  const slotIds = slotInfos.map(slot => slot.addressableArea?.id)
  if (
    slotIds.includes('A1') &&
    Object.values(moduleEntities).find(
      module => module.type === THERMOCYCLER_MODULE_TYPE
    )
  ) {
    return (
      hasOverlappingRectangles(
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
  wellLocationOffset: Point
): Point => {
  const wellDimensions = labwareEntity.def.dimensions

  //  getting location from the bottom of the well since PD
  return {
    x: wellLocationOffset.x + wellDimensions.xDimension,
    y: wellLocationOffset.y + wellDimensions.yDimension,
    z: (wellLocationOffset.z ?? 0) + wellDimensions.zDimension,
  }
}

//  util to use in step-generation for if the pipette movement is safe
export const getIsSafePipetteMovement = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  pipetteId: string,
  labwareId: string,
  tipRackId: string,
  wellLocationOffset: Point
): boolean => {
  const deckDefinition = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const {
    pipetteEntities,
    labwareEntities,
    additionalEquipmentEntities,
    moduleEntities,
  } = invariantContext
  const { labware: labwareState, tipState, modules } = robotState
  const nozzleConfiguration = 'COLUMN'

  //  early exit if labwareId is a trashBin or wasteChute
  if (labwareEntities[labwareId] == null) {
    return true
  }

  const stagingAreaSlots = Object.values(additionalEquipmentEntities)
    .filter(ae => ae.name === 'stagingArea')
    .map(stagingArea => stagingArea.location as string)
  const pipetteEntity = pipetteEntities[pipetteId]
  const pipetteHasTip = tipState.pipettes[pipetteId]
  const tipLength = pipetteHasTip
    ? labwareEntities[tipRackId].def.parameters.tipLength ?? 0
    : 0
  const wellLocationPoint = getWellPosition(
    labwareEntities[labwareId],
    wellLocationOffset
  )

  const isWithinPipetteExtents = getIsWithinPipetteExtents(
    pipetteEntity,
    wellLocationPoint,
    nozzleConfiguration,
    //  TODO(jr, 4/22/24): PD only supports A12 as a primary nozzle for now
    PRIMARY_NOZZLE
  )
  if (!isWithinPipetteExtents) {
    return false
  } else {
    const labwareSlot = labwareState[labwareId].slot
    let deckSlot = labwareSlot
    if (modules[labwareSlot] != null) {
      deckSlot = modules[labwareSlot].slot
    } else if (labwareState[labwareSlot] != null) {
      const adapterSlot = labwareState[labwareSlot].slot
      const adapterInModuleSlot =
        modules[adapterSlot] != null ? modules[adapterSlot].slot : null
      if (adapterInModuleSlot != null) {
        deckSlot = adapterInModuleSlot
      } else {
        deckSlot = adapterSlot
      }
    }
    const pipetteBoundsAtWellLocation = getPipetteBoundsAtSpecifiedMoveToPosition(
      PRIMARY_NOZZLE,
      pipetteEntity,
      tipLength,
      wellLocationOffset
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
        slotInfos,
        moduleEntities
      ) &&
      !slotHasPotentialCollidingObject(
        pipetteBoundsAtWellLocation,
        slotInfos,
        robotState,
        invariantContext,
        labwareId
      )
    )
  }
}
