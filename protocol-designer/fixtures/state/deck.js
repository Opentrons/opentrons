import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
} from '@opentrons/shared-data'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate'

const mockMagneticModule = {
  id: 'mag_mod',
  moduleState: {
    type: MAGNETIC_MODULE_TYPE,
    engaged: false,
  },
  type: MAGNETIC_MODULE_TYPE,
  slot: '7',
  model: MAGNETIC_MODULE_V1,
}

const mockTemperatureModule = {
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

const mockDeckSetup = {
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

export const getMockMagneticModule = () => mockMagneticModule
export const getMockTemperatureModule = () => mockTemperatureModule
export const getMockDeckSetup = () => mockDeckSetup
