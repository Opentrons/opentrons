import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate'
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_DEACTIVATED,
} from '@opentrons/shared-data'

export const mockMagneticModule = {
  id: 'mag_mod',
  moduleState: {
    type: MAGNETIC_MODULE_TYPE,
    engaged: false,
  },
  type: MAGNETIC_MODULE_TYPE,
  slot: '7',
  model: MAGNETIC_MODULE_V1,
}

export const mockTemperatureModule = {
  id: 'temp_mod',
  moduleState: {
    type: TEMPERATURE_MODULE_TYPE,
    status: TEMPERATURE_DEACTIVATED,
    targetTemperature: null,
  },
  type: TEMPERATURE_MODULE_TYPE,
  slot: '8',
  model: TEMPERATURE_MODULE_V1,
}

export const mockDeckSetup = {
  labware: {
    well96Id: {
      ...fixture_96_plate,
      slot: '1',
    },
  },
  modules: {
    mag_mod: mockMagneticModule,
    temp_mod: mockTemperatureModule,
  },
  pipettes: {},
}
