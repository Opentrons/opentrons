import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ModuleSlot } from '..'

import type { ComponentProps } from 'react'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { ModuleEntities, RobotState } from '@opentrons/step-generation'

const MOCK_MODULE_ID = 'mockModuleId'

const createMockModuleEntities = (
  moduleType: ModuleType,
  model: ModuleModel
): ModuleEntities => {
  return {
    [MOCK_MODULE_ID]: {
      id: MOCK_MODULE_ID,
      type: moduleType,
      model,
      pythonName: `mock_${moduleType.toLowerCase()}`,
    },
  }
}

const createMockRobotState = (
  moduleState: RobotState['modules'][string]['moduleState']
): RobotState => {
  return {
    labware: {},
    pipettes: {},
    modules: {
      [MOCK_MODULE_ID]: {
        slot: '1',
        moduleState,
      },
    },
    liquidState: {
      pipettes: {},
      labware: {},
      trashBins: {},
      wasteChute: {},
    },
    tipState: {
      pipettes: {},
      tipracks: {},
    },
  } as RobotState
}

const render = (props: ComponentProps<typeof ModuleSlot>) => {
  return renderWithProviders(<ModuleSlot {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ModuleSlot', () => {
  it('should render Thermocycler', () => {
    const props: ComponentProps<typeof ModuleSlot> = {
      moduleId: MOCK_MODULE_ID,
      moduleEntities: createMockModuleEntities(
        THERMOCYCLER_MODULE_TYPE,
        THERMOCYCLER_MODULE_V1
      ),
      moduleRobotState: createMockRobotState({
        type: THERMOCYCLER_MODULE_TYPE,
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 95,
        },
        lidTargetTemp: 105,
        lidOpen: false,
        numProfilesStarted: 0,
      }).modules,
    }
    render(props)
    screen.getByText('Thermocycler Module GEN1')
    screen.getByText('Target block temperature')
    screen.getByText('95 °C')
    screen.getByText('Target lid temperature')
    screen.getByText('105 °C')
    screen.getByText('Lid status')
    screen.getByText('Closed')
  })

  it('should render HeaterShaker', () => {
    const props: ComponentProps<typeof ModuleSlot> = {
      moduleId: MOCK_MODULE_ID,
      moduleEntities: createMockModuleEntities(
        HEATERSHAKER_MODULE_TYPE,
        HEATERSHAKER_MODULE_V1
      ),
      moduleRobotState: createMockRobotState({
        type: HEATERSHAKER_MODULE_TYPE,
        targetTemp: 37,
        targetSpeed: 300,
        latchOpen: true,
      }).modules,
    }
    render(props)
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Target temperature')
    screen.getByText('37 °C')
    screen.getByText('Target speed')
    screen.getByText('300 RPM')
    screen.getByText('Labware latch')
    screen.getByText('Open')
  })

  it('should render Magnetic block', () => {
    const props: ComponentProps<typeof ModuleSlot> = {
      moduleId: MOCK_MODULE_ID,
      moduleEntities: createMockModuleEntities(
        MAGNETIC_BLOCK_TYPE,
        MAGNETIC_BLOCK_V1
      ),
      moduleRobotState: createMockRobotState({
        type: MAGNETIC_BLOCK_TYPE,
      }).modules,
    }
    render(props)
    screen.getByText('Magnetic Block GEN1')
  })

  it('should render absorbance reader', () => {
    const props: ComponentProps<typeof ModuleSlot> = {
      moduleId: MOCK_MODULE_ID,
      moduleEntities: createMockModuleEntities(
        ABSORBANCE_READER_TYPE,
        ABSORBANCE_READER_V1
      ),
      moduleRobotState: createMockRobotState({
        type: ABSORBANCE_READER_TYPE,
        lidOpen: false,
        initialization: {
          mode: 'single',
          wavelengths: [260, 280],
          referenceWavelength: 230,
        },
      }).modules,
    }
    render(props)
    screen.getByText('Absorbance Plate Reader Module GEN1')
    screen.getByText('Lid status')
    screen.getByText('Closed')
    screen.getByText('Initialization')
    screen.getByText('single')
    screen.getByText('Wavelengths')
    screen.getByText('Reference wavelength')
    screen.getByText('230')
  })
})
