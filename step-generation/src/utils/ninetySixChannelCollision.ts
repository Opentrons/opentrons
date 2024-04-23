import toNumber from 'lodash/toNumber'
import { NozzleConfigurationStyle, getModuleDef2 } from '@opentrons/shared-data'
import type { RobotState, InvariantContext, PipetteEntity } from '../types'

const SAFETY_MARGIN = 10
const targetNumbers = ['2', '3', '4']
const A12_column_front_left_bound = { x: -11.03, y: 2 }
const A12_column_back_right_bound = { x: 526.77, y: 506.2 }
const PRIMARY_NOZZLE = 'A12'

type Point = { x: number; y: number; z?: number }

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
    }
    case 8:
    case 1:
      //  TODO(jr, 4/22/24): update this to support 8-channel partial tip
      //  and eventually all pipettes
      return true
  }
}

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

export const getIsSafePipetteMovement = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  pipetteId: string,
  destLabwareId: string,
  tipRackId: string,
  destWellName: string,
  destWellLocation: {
    origin: string
    offset: { x: number; y: number; z: number }
  }
): boolean => {
  const { pipetteEntities, labwareEntities } = invariantContext
  const { labware: labwareState, pipettes, tipState } = robotState
  const pipetteEntity = pipetteEntities[pipetteId]
  const pipetteHasTip = tipState.pipettes[pipetteId]
  const tipLength = pipetteHasTip
    ? labwareEntities[tipRackId].def.parameters.tipLength ?? 0
    : 0
  const nozzleConfiguration = pipettes[pipetteId].nozzles
  const location = {
    x: destWellLocation.offset.x,
    y: destWellLocation.offset.y,
  }

  //  early exit for now if nozzle configuration is not partial tip
  if (nozzleConfiguration !== 'COLUMN') {
    return true
  }

  const isWithinPipetteExtents = getIsWithinPipetteExtents(
    pipetteEntity,
    location,
    nozzleConfiguration,
    //  TODO(jr, 4/22/24): PD only supports A12 as a primary nozzle for now
    PRIMARY_NOZZLE
  )

  if (!isWithinPipetteExtents) {
    return false
  } else {
    const labwareSlot = labwareState[destLabwareId].slot
    const pipetteBoundsAtWellLocation = getPipetteBoundsAtSpecifiedMoveToPosition(
      PRIMARY_NOZZLE,
      pipetteEntity,
      tipLength,
      destWellLocation.offset
    )
    const surroundingSlots = []
  }
}
export const getIsTallLabwareWestOf96Channel = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  sourceLabwareId: string,
  pipetteId: string,
  tipRackId: string
): boolean => {
  const {
    labwareEntities,
    additionalEquipmentEntities,
    pipetteEntities,
  } = invariantContext
  const { labware: labwareState, tipState } = robotState
  const test = pipetteEntities[pipetteId].spec.pipetteBoundingBoxOffsets
  const pipetteHasTip = tipState.pipettes[pipetteId]
  const tipLength = pipetteHasTip
    ? labwareEntities[tipRackId].def.parameters.tipLength ?? 0
    : 0
  // early exit if source labware is the waste chute or trash bin
  if (additionalEquipmentEntities[sourceLabwareId] != null) {
    return false
  }

  const labwareSlot = labwareState[sourceLabwareId].slot
  const letter = labwareSlot.charAt(0)
  const number = labwareSlot.charAt(1)

  if (targetNumbers.includes(number)) {
    const westNumber = toNumber(number) - 1
    const westSlot = letter + westNumber

    const westLabwareState = Object.entries(labwareState).find(
      ([id, labware]) => labware.slot === westSlot
    )
    if (westLabwareState != null) {
      const westLabwareId = westLabwareState[0]
      if (labwareEntities[westLabwareId] == null) {
        console.error(
          `expected to find labware west of source labware but could not, with labware id ${westLabwareId}`
        )
      }
      if (labwareEntities[westLabwareId] != null) {
        const westLabwareHeight =
          labwareEntities[westLabwareId].def.dimensions.zDimension
        const westLabwareSlot = robotState.labware[westLabwareId].slot
        let adapterHeight: number = 0
        let moduleHeight: number = 0
        //  if labware is on an adapter + or on an adapter + module
        if (robotState.labware[westLabwareSlot] != null) {
          const adapterSlot = robotState.labware[westLabwareSlot]?.slot
          adapterHeight =
            invariantContext.labwareEntities[westLabwareSlot]?.def.dimensions
              .zDimension
          const moduleModel =
            invariantContext.moduleEntities[adapterSlot]?.model
          const moduleDimensions =
            moduleModel != null ? getModuleDef2(moduleModel)?.dimensions : null
          moduleHeight =
            moduleDimensions != null ? moduleDimensions.bareOverallHeight : 0
          //  if labware is on a module
        } else if (invariantContext.moduleEntities[westLabwareSlot] != null) {
          const moduleModel =
            invariantContext.moduleEntities[westLabwareSlot].model
          moduleHeight = getModuleDef2(moduleModel).dimensions.bareOverallHeight
        }
        const totalHighestZ = westLabwareHeight + adapterHeight + moduleHeight
        const sourceLabwareHeight =
          labwareEntities[sourceLabwareId].def.dimensions.zDimension

        return totalHighestZ + SAFETY_MARGIN > sourceLabwareHeight + tipLength
      }
    }
  }

  return false
}
