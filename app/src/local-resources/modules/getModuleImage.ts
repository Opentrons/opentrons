import magneticModule from '/app/assets/images/magnetic_module_gen_2_transparent.png'
import temperatureModule from '/app/assets/images/temp_deck_gen_2_transparent.png'
import thermoModuleGen1 from '/app/assets/images/thermocycler_closed.png'
import heaterShakerModule from '/app/assets/images/heater_shaker_module_transparent.png'
import magneticModuleHighRes from '/app/assets/images/modules/magneticModuleV2@3x.png'
import temperatureModuleHighRes from '/app/assets/images/modules/temperatureModuleV2@3x.png'
import thermoModuleGen1HighRes from '/app/assets/images/modules/thermocyclerModuleV1@3x.png'
import heaterShakerModuleHighRes from '/app/assets/images/modules/heaterShakerModuleV1@3x.png'
import thermoModuleGen2 from '/app/assets/images/thermocycler_gen_2_closed.png'
import magneticBlockGen1 from '/app/assets/images/magnetic_block_gen_1.png'
import absorbanceReader from '/app/assets/images/opentrons_plate_reader.png'

import type { ModuleModel } from '@opentrons/shared-data'

export function getModuleImage(
  model: ModuleModel,
  highRes: boolean = false
): string {
  switch (model) {
    case 'magneticModuleV1':
    case 'magneticModuleV2':
      return highRes ? magneticModuleHighRes : magneticModule
    case 'temperatureModuleV1':
    case 'temperatureModuleV2':
      return highRes ? temperatureModuleHighRes : temperatureModule
    case 'heaterShakerModuleV1':
      return highRes ? heaterShakerModuleHighRes : heaterShakerModule
    case 'thermocyclerModuleV1':
      return highRes ? thermoModuleGen1HighRes : thermoModuleGen1
    case 'thermocyclerModuleV2':
      return thermoModuleGen2
    case 'magneticBlockV1':
      return magneticBlockGen1
    case 'absorbanceReaderV1':
      return absorbanceReader
    default:
      return 'Error: unknown module model'
  }
}
