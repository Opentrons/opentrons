import flexStacker from '/app/assets/images/flex_stacker_no_labware.png'
import heaterShakerModule from '/app/assets/images/heater_shaker_module_transparent.png'
import magneticModule from '/app/assets/images/magnetic_module_gen_2_transparent.png'
import absorbanceReader from '/app/assets/images/opentrons_plate_reader.png'
import temperatureModule from '/app/assets/images/temp_deck_gen_2_transparent.png'
import thermoModuleGen1Closed from '/app/assets/images/thermocycler_closed.png'
import thermoModuleGen2Closed from '/app/assets/images/thermocycler_gen_2_closed.png'
import thermoModuleGen2Opened from '/app/assets/images/thermocycler_gen_2_opened.png'
import thermoModuleGen1Opened from '/app/assets/images/thermocycler_open_transparent.png'
import vacuumModule from '/app/assets/images/vacuum_module_v1.png'

import { NO_CALIBRATION_TYPE } from './constants'

import type { TFunction } from 'i18next'
import type { ChipType } from '@opentrons/components'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type {
  AttachedModule,
  VacuumModuleStatus,
} from '@opentrons/api-client'

export function getModuleCardImage(attachedModule: AttachedModule): string {
  switch (attachedModule.moduleModel) {
    case 'magneticModuleV1':
    case 'magneticModuleV2':
      return magneticModule
    case 'temperatureModuleV1':
    case 'temperatureModuleV2':
      return temperatureModule
    case 'heaterShakerModuleV1':
      return heaterShakerModule
    case 'thermocyclerModuleV1':
      if (attachedModule.data.lidStatus === 'closed') {
        return thermoModuleGen1Closed
      } else {
        return thermoModuleGen1Opened
      }
    case 'thermocyclerModuleV2':
      if (attachedModule.data.lidStatus === 'closed') {
        return thermoModuleGen2Closed
      } else {
        return thermoModuleGen2Opened
      }
    case 'absorbanceReaderV1':
      return absorbanceReader
    case 'flexStackerModuleV1':
      return flexStacker
    //  this should never be reached
    case 'vacuumModuleV1':
      return vacuumModule
    default:
      return 'unknown module model, this is an error'
  }
}

export const getPumpStatusProps = (
  t: TFunction,
  status: VacuumModuleStatus
): { text: string; type: ChipType } => {
  if (status === 'idle') {
    return { text: t('pump_idle'), type: 'neutral' }
  }
  if (status === 'error') {
    return { text: t('pump_error'), type: 'error' }
  }
  return { text: t('pump_engaged'), type: 'info' }
}

export const getCanCalibrateModule = (
  module: AttachedModule,
  isFlex: boolean
): boolean => isFlex && !NO_CALIBRATION_TYPE.includes(module.moduleType)

export const getIsModuleCalibrated = (module: AttachedModule): boolean =>
  module.moduleOffset?.last_modified != null

export const getModuleCalibrationRequired = (
  module: AttachedModule,
  isFlex: boolean
): boolean => {
  if (!getCanCalibrateModule(module, isFlex)) {
    return false
  }
  return !getIsModuleCalibrated(module)
}

export const getModuleSetupRequired = (
  module: AttachedModule,
  isFlex: boolean,
  deckConfig?: DeckConfiguration
): boolean => {
  if (!isFlex) {
    return false
  }
  return !(
    deckConfig?.some(
      ({ opentronsModuleSerialNumber }) =>
        opentronsModuleSerialNumber === module.serialNumber
    ) ?? false
  )
}
