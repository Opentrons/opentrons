import { FLEX_TRASH_DEF_URI } from '../constants'
import type { RobotState, InvariantContext } from '../types'

export const getIsTallLabwareWestOf96Channel = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  sourceLabwareId: string
): boolean => {
  const { labwareEntities, additionalEquipmentEntities } = invariantContext
  const { labware: labwareState } = robotState

  // early exit if source labware is the waste chute since there
  // are no collision warnings with the waste chute
  if (additionalEquipmentEntities[sourceLabwareId] != null) {
    return false
  }

  const labwareSlot = labwareState[sourceLabwareId].slot
  const letter = labwareSlot.charAt(0)
  const number = labwareSlot.charAt(1)

  // no collision warnings when source labware is trash bin
  if (labwareEntities[sourceLabwareId].labwareDefURI === FLEX_TRASH_DEF_URI) {
    return false
  }

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
        const heightDifferences = sourceLabwareHeight - westLabwareHeight
        //  TODO(jr, 11/6/23): update height differences when we know
        return heightDifferences < 10
      }
    }
  }

  return false
}
