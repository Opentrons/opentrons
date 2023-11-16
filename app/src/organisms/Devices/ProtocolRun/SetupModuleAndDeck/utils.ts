import {
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import magneticModule from '../../../../assets/images/magnetic_module_gen_2_transparent.png'
import temperatureModule from '../../../../assets/images/temp_deck_gen_2_transparent.png'
import thermoModuleGen1 from '../../../../assets/images/thermocycler_closed.png'
import heaterShakerModule from '../../../../assets/images/heater_shaker_module_transparent.png'
import thermoModuleGen2 from '../../../../assets/images/thermocycler_gen_2_closed.png'
import magneticBlockGen1 from '../../../../assets/images/magnetic_block_gen_1.png'
import trashBin from '../../../../assets/images/flex_trash_bin.png'
import stagingArea from '../../../../assets/images/staging_area_slot.png'
import wasteChute from '../../../../assets/images/waste_chute.png'
//  TODO(jr, 10/17/23): figure out if we need this asset, I'm stubbing it in for now
// import wasteChuteStagingArea from '../../../../assets/images/waste_chute_with_staging_area.png'

import type {
  CutoutFixtureId,
  ModuleModel,
  SingleSlotCutoutFixtureId,
  WasteChuteCutoutFixtureId,
} from '@opentrons/shared-data'

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

//  TODO(jr, 10/4/23): add correct assets for trashBin, standardSlot, wasteChuteAndStagingArea
export function getFixtureImage(fixture: CutoutFixtureId): string {
  if (fixture === STAGING_AREA_RIGHT_SLOT_FIXTURE) {
    return stagingArea
  } else if (
    WASTE_CHUTE_FIXTURES.includes(fixture as WasteChuteCutoutFixtureId)
  ) {
    return wasteChute
  } else if (
    // TODO(bh, 2023-11-13): this asset probably won't exist
    SINGLE_SLOT_FIXTURES.includes(fixture as SingleSlotCutoutFixtureId)
  ) {
    return stagingArea
  } else if (fixture === TRASH_BIN_ADAPTER_FIXTURE) {
    return trashBin
  } else {
    return 'Error: unknown fixture'
  }
}
