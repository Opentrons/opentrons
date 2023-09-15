import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  TOO_HOT_TEMP,
} from '@opentrons/shared-data'
import type { AttachedModule } from '../../redux/modules/types'

export function getModuleTooHot(module: AttachedModule): boolean {
  switch (module.moduleType) {
    case HEATERSHAKER_MODULE_TYPE:
    case TEMPERATURE_MODULE_TYPE:
      return (
        module.data.currentTemperature != null &&
        module.data.currentTemperature > TOO_HOT_TEMP
      )
    case THERMOCYCLER_MODULE_TYPE:
      return (
        (module.data.currentTemperature != null &&
          module.data.currentTemperature > TOO_HOT_TEMP) ||
        (module.data.lidTemperature != null &&
          module.data.lidTemperature > TOO_HOT_TEMP)
      )
    default:
      return false
  }
}
