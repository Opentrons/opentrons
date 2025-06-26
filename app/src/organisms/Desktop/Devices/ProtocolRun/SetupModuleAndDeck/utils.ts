import {
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
} from '@opentrons/shared-data'

import trashBin from '/app/assets/images/flex_trash_bin.png'
import heaterShakerModule from '/app/assets/images/heater_shaker_module_transparent.png'
import magneticBlockGen1 from '/app/assets/images/magnetic_block_gen_1.png'
import stagingAreaMagneticBlockGen1 from '/app/assets/images/staging_area_magnetic_block_gen_1.png'
import stagingArea from '/app/assets/images/staging_area_slot.png'
import temperatureModule from '/app/assets/images/temp_deck_gen_2_transparent.png'
import thermoModuleGen2 from '/app/assets/images/thermocycler_gen_2_closed.png'
import wasteChuteStagingArea from '/app/assets/images/waste_chute_with_staging_area.png'
import wasteChute from '/app/assets/images/waste_chute.png'

import type { CutoutFixtureId } from '@opentrons/shared-data'

export function getFixtureImage(cutoutFixtureId: CutoutFixtureId): string {
  if (SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)) {
    // TODO: replace with image for single slot fixtures once we get final renders
    return stagingArea
  } else if (cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE) {
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
