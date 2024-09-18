import {
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
} from '@opentrons/shared-data'

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
import stagingAreaMagneticBlockGen1 from '/app/assets/images/staging_area_magnetic_block_gen_1.png'
import trashBin from '/app/assets/images/flex_trash_bin.png'
import stagingArea from '/app/assets/images/staging_area_slot.png'
import wasteChute from '/app/assets/images/waste_chute.png'
import wasteChuteStagingArea from '/app/assets/images/waste_chute_with_staging_area.png'

import type { CutoutFixtureId, ModuleModel } from '@opentrons/shared-data'

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
    default:
      return 'Error: unknown module model'
  }
}

export function getFixtureImage(cutoutFixtureId: CutoutFixtureId): string {
  if (cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE) {
    return stagingArea
  } else if (WASTE_CHUTE_ONLY_FIXTURES.includes(cutoutFixtureId)) {
    return wasteChute
  } else if (WASTE_CHUTE_STAGING_AREA_FIXTURES.includes(cutoutFixtureId)) {
    return wasteChuteStagingArea
  } else if (cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE) {
    return trashBin
  } else if (cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE) {
    return thermoModuleGen2
  } else if (cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE) {
    return thermoModuleGen2
  } else if (cutoutFixtureId === HEATERSHAKER_MODULE_V1_FIXTURE) {
    return heaterShakerModule
  } else if (cutoutFixtureId === TEMPERATURE_MODULE_V2_FIXTURE) {
    return temperatureModule
  } else if (cutoutFixtureId === MAGNETIC_BLOCK_V1_FIXTURE) {
    return magneticBlockGen1
  } else if (
    cutoutFixtureId === STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
  ) {
    return stagingAreaMagneticBlockGen1
  } else {
    return 'Error: unknown fixture'
  }
}
