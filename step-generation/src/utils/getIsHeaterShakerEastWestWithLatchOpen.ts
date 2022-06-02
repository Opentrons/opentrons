import some from 'lodash/some'
import {
  getAreSlotsHorizontallyAdjacent,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import type { LabwareTemporalProperties, RobotState } from '../types'

export const getIsHeaterShakerEastWestWithLatchOpen = (
  hwModules: RobotState['modules'],
  labwareTemporalProperties: LabwareTemporalProperties
): boolean =>
  some(
    hwModules,
    hwModule =>
      hwModule.moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      hwModule.moduleState.latchOpen === true &&
      getAreSlotsHorizontallyAdjacent(
        hwModule.slot,
        labwareTemporalProperties.slot
      )
  )
