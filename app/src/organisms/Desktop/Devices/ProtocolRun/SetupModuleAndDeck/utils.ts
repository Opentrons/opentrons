import {
  FLEX_STACKER_V1_FIXTURE,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FLEX_STACKER_FIXTURES,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
} from '@opentrons/shared-data'

import flexStackerWithoutLabware from '/app/assets/images/flex_stacker_no_labware.png'
import flexStackerWithWasteChute from '/app/assets/images/flex_stacker_waste_chute.png'
import trashBin from '/app/assets/images/flex_trash_bin.png'
import heaterShakerModule from '/app/assets/images/heater_shaker_module_transparent.png'
import magneticBlockGen1 from '/app/assets/images/magnetic_block_gen_1.png'
import singleCenterSlot from '/app/assets/images/single_center_slot.png'
import singleLeftSlot from '/app/assets/images/single_left_slot.png'
import singleRightSlot from '/app/assets/images/single_right_slot.png'
import stagingAreaMagneticBlockGen1 from '/app/assets/images/staging_area_magnetic_block_gen_1.png'
import stagingArea from '/app/assets/images/staging_area_slot.png'
import temperatureModule from '/app/assets/images/temp_deck_gen_2_transparent.png'
import thermoModuleGen2 from '/app/assets/images/thermocycler_gen_2_closed.png'
import wasteChuteStagingArea from '/app/assets/images/waste_chute_with_staging_area.png'
import wasteChute from '/app/assets/images/waste_chute.png'

import type { CutoutFixtureId } from '@opentrons/shared-data'

export function getFixtureImage(cutoutFixtureId: CutoutFixtureId): string {
  switch (cutoutFixtureId) {
    case SINGLE_LEFT_SLOT_FIXTURE:
      return singleLeftSlot
    case SINGLE_RIGHT_SLOT_FIXTURE:
      return singleRightSlot
    case SINGLE_CENTER_SLOT_FIXTURE:
      return singleCenterSlot
    case STAGING_AREA_RIGHT_SLOT_FIXTURE:
      return stagingArea
    case TRASH_BIN_ADAPTER_FIXTURE:
      return trashBin
    case THERMOCYCLER_V2_REAR_FIXTURE:
    case THERMOCYCLER_V2_FRONT_FIXTURE:
      return thermoModuleGen2
    case HEATERSHAKER_MODULE_V1_FIXTURE:
      return heaterShakerModule
    case TEMPERATURE_MODULE_V2_FIXTURE:
      return temperatureModule
    case MAGNETIC_BLOCK_V1_FIXTURE:
      return magneticBlockGen1
    case FLEX_STACKER_V1_FIXTURE:
      return flexStackerWithoutLabware
    case STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE:
      return stagingAreaMagneticBlockGen1
    default:
      // Handle array-based checks
      if (WASTE_CHUTE_ONLY_FIXTURES.includes(cutoutFixtureId)) {
        return wasteChute
      } else if (WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(cutoutFixtureId)) {
        return flexStackerWithWasteChute
      } else if (WASTE_CHUTE_STAGING_AREA_FIXTURES.includes(cutoutFixtureId)) {
        return wasteChuteStagingArea
      } else {
        console.log('unknown fixture: ', cutoutFixtureId)
        return 'Error: unknown fixture'
      }
  }
}
