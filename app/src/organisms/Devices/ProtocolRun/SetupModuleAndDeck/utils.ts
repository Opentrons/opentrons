import magneticModule from '../../../../assets/images/magnetic_module_gen_2_transparent.png'
import temperatureModule from '../../../../assets/images/temp_deck_gen_2_transparent.png'
import thermoModuleGen1 from '../../../../assets/images/thermocycler_closed.png'
import heaterShakerModule from '../../../../assets/images/heater_shaker_module_transparent.png'
import thermoModuleGen2 from '../../../../assets/images/thermocycler_gen_2_closed.png'
import magneticBlockGen1 from '../../../../assets/images/magnetic_block_gen_1.png'
import stagingArea from '../../../../assets/images/staging_area_slot.png'
import type { FixtureLoadName, ModuleModel } from '@opentrons/shared-data'

export function getModuleImage(model: ModuleModel): string {
  switch (model) {
    case 'magneticModuleV1':
    case 'magneticModuleV2':
      return magneticModule
    case 'temperatureModuleV1':
    case 'temperatureModuleV2':
      return temperatureModule
    case 'heaterShakerModuleV1':
      return heaterShakerModule
    case 'thermocyclerModuleV1':
      return thermoModuleGen1
    case 'thermocyclerModuleV2':
      return thermoModuleGen2
    case 'magneticBlockV1':
      return magneticBlockGen1
    default:
      return 'Error: unknown module model'
  }
}

//  TODO(jr, 10/4/23): add correct assets for wasteChute, trashBin, standardSlot
export function getFixtureImage(fixture: FixtureLoadName): string {
  switch (fixture) {
    case 'stagingArea': {
      return stagingArea
    }
    case 'wasteChute': {
      return stagingArea
    }
    case 'standardSlot': {
      return stagingArea
    }
    case 'trashBin': {
      return stagingArea
    }
    default:
      return 'Error: unknown fixture'
  }
}
