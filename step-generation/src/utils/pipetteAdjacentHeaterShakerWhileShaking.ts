import {
  getAreSlotsAdjacent,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import some from 'lodash/some'
import type { LabwareTemporalProperties, RobotState } from '../types'

export const pipetteAdjacentHeaterShakerWhileShaking = (
  hwModules: RobotState['modules'],
  labwareTemporalProperties: LabwareTemporalProperties
): boolean =>
  some(
    hwModules,
    hwModule =>
      hwModule.moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      hwModule.moduleState.targetSpeed != null &&
      hwModule.moduleState.targetSpeed > 0 &&
      getAreSlotsAdjacent(hwModule.slot, labwareTemporalProperties.slot)
  )
