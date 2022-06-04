import some from 'lodash/some'
import {
  getAreSlotsHorizontallyAdjacent,
  getIsLabwareAboveHeight,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
} from '@opentrons/shared-data'
import type { LabwareEntities, RobotState } from '../types'

export const getIsTallLabwareEastWestOfHeaterShaker = (
  labwareState: RobotState['labware'],
  labwareEntities: LabwareEntities,
  heaterShakerSlot: string
): boolean => {
  const isTallLabwareEastWestOfHeaterShaker = some(
    labwareState,
    (labwareProperties, labwareId) =>
      getAreSlotsHorizontallyAdjacent(
        heaterShakerSlot,
        labwareProperties.slot
      ) &&
      getIsLabwareAboveHeight(
        labwareEntities[labwareId].def,
        MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
      )
  )
  return isTallLabwareEastWestOfHeaterShaker
}
