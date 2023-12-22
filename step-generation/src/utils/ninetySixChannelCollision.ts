import toNumber from 'lodash/toNumber'
import { getModuleDef2 } from '@opentrons/shared-data'
import type { RobotState, InvariantContext } from '../types'

const SAFETY_MARGIN = 10
const targetNumbers = ['2', '3', '4']

export const getIsTallLabwareWestOf96Channel = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  sourceLabwareId: string,
  pipetteId: string,
  tipRackId: string
): boolean => {
  const { labwareEntities, additionalEquipmentEntities } = invariantContext
  const { labware: labwareState, tipState } = robotState
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
