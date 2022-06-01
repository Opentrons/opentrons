import some from 'lodash/some'
import type { LabwareEntities, RobotState } from '../types'
import { getIsLabwareAboveHeight } from '@opentrons/shared-data'
import { MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM } from '../../../shared-data/js/constants'

// this util only works for outter slots (where we can safely place modules in PD)
const getSlotNextTo = (slot: string): string | null => {
  const SLOT_ADJACENT_MAP: Record<string, string> = {
    '1': '2',
    '3': '2',
    '4': '5',
    '6': '5',
    '7': '8',
    '9': '8',
    '10': '11',
  }

  return SLOT_ADJACENT_MAP[slot] ?? null
}

export const getIsTallLabwareEastWestOfHeaterShaker = (
  labwareState: RobotState['labware'],
  labwareEntities: LabwareEntities,
  heaterShakerSlot: string
): boolean => {
  const isTallLabwareEastWestOfHeaterShaker = some(
    labwareState,
    (labwareProperties, labwareId) =>
      getSlotNextTo(heaterShakerSlot) === labwareProperties.slot &&
      getIsLabwareAboveHeight(
        labwareEntities[labwareId].def,
        MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
      )
  )
  return isTallLabwareEastWestOfHeaterShaker
}
