import magneticModule from '../../assets/images/magnetic_module_gen_2_transparent.svg'
import temperatureModule from '../../assets/images/temp_deck_gen_2_transparent.svg'
import thermoModule from '../../assets/images/thermocycler_closed.svg'
import heaterShakerModule from '../../assets/images/heatershaker_module_transparent.svg'
import thermoModuleGen2Closed from '../../assets/images/thermocycler_gen_2_closed.png'
import thermoModuleGen2Opened from '../../assets/images/thermocycler_gen_2_opened.png'

import type { AttachedModule } from '../../redux/modules/types'

export function getModuleCardImage(attachedModule: AttachedModule): string {
  //  TODO(jr, 9/22/22): add images for V1 of magneticModule and temperatureModule
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
      return thermoModule
    case 'thermocyclerModuleV2':
      if (attachedModule.data.lidStatus === 'closed') {
        return thermoModuleGen2Closed
      } else {
        return thermoModuleGen2Opened
      }
    //  this should never be reached
    default:
      return 'unknown module model, this is an error'
  }
}
