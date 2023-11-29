import type { RobotState, InvariantContext } from '../types'

const SAFETY_MARGIN = 10

export const getIsTallLabwareWestOf96Channel = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  sourceLabwareId: string,
  pipetteId: string
): boolean => {
  const {
    labwareEntities,
    additionalEquipmentEntities,
    pipetteEntities,
  } = invariantContext
  const { labware: labwareState, tipState } = robotState
  const pipetteHasTip = tipState.pipettes[pipetteId]
  const tipLength = pipetteHasTip
    ? pipetteEntities[pipetteId].tiprackLabwareDef.parameters.tipLength ?? 0
    : 0
  // early exit if source labware is the waste chute or trash bin since there
  // are no collision warnings with those
  if (additionalEquipmentEntities[sourceLabwareId] != null) {
    return false
  }

  const labwareSlot = labwareState[sourceLabwareId].slot
  const letter = labwareSlot.charAt(0)
  const number = labwareSlot.charAt(1)

  if (number === '2' || number === '3' || number === '4') {
    const westNumber = String.fromCharCode(number.charCodeAt(0) - 1)
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
        const sourceLabwareHeight =
          labwareEntities[sourceLabwareId].def.dimensions.zDimension
        if (westLabwareHeight === sourceLabwareHeight) {
          return false
        }

        return (
          westLabwareHeight > sourceLabwareHeight + tipLength - SAFETY_MARGIN
        )
      }
    }
  }

  return false
}
