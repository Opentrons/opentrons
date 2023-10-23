import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../../redux/modules/__fixtures__'
import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'
import { formatLastCalibrated } from '../utils'
import { ModuleCalibrationItems } from '../ModuleCalibrationItems'

import type { AttachedModule } from '@opentrons/api-client'

jest.mock('../ModuleCalibrationOverflowMenu')

const mockModuleCalibrationOverflowMenu = ModuleCalibrationOverflowMenu as jest.MockedFunction<
  typeof ModuleCalibrationOverflowMenu
>

const mockCalibratedModule = {
  id: '1436cd6085f18e5c315d65bd835d899a631cc2ba',
  serialNumber: 'TC2PVT2023040702',
  firmwareVersion: 'v1.0.4',
  hardwareRevision: 'Opentrons-thermocycler-gen2',
  hasAvailableUpdate: false,
  moduleType: 'thermocyclerModuleType',
  moduleModel: 'thermocyclerModuleV2',
  moduleOffset: {
    offset: {
      x: 0.1640625,
      y: -1.2421875,
      z: -1.759999999999991,
    },
    slot: '7',
    last_modified: '2023-06-01T14:42:20.131798+00:00',
  },
  data: {
    status: 'holding at target',
    currentTemperature: 10,
    targetTemperature: 10,
    lidStatus: 'open',
    lidTemperatureStatus: 'holding at target',
    lidTemperature: 100,
    lidTargetTemperature: 100,
    holdTime: 0,
    currentCycleIndex: 1,
    totalCycleCount: 1,
    currentStepIndex: 1,
    totalStepCount: 1,
  },
  usbPort: {
    port: 3,
    portGroup: 'left',
    hub: false,
    path: '1.0/tty/ttyACM3/dev',
  },
}

const render = (
  props: React.ComponentProps<typeof ModuleCalibrationItems>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<ModuleCalibrationItems {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ModuleCalibrationItems', () => {
  let props: React.ComponentProps<typeof ModuleCalibrationItems>

  beforeEach(() => {
    props = {
      attachedModules: mockFetchModulesSuccessActionPayloadModules,
      updateRobotStatus: jest.fn(),
      formattedPipetteOffsetCalibrations: [],
    }
    mockModuleCalibrationOverflowMenu.mockReturnValue(
      <div>mock ModuleCalibrationOverflowMenu</div>
    )
  })

  it('should render module information and overflow menu', () => {
    const [{ getByText, getAllByText }] = render(props)
    getByText('Module')
    getByText('Serial')
    getByText('Last Calibrated')
    getByText('Magnetic Module GEN1')
    getByText('def456')
    getByText('Temperature Module GEN1')
    getByText('abc123')
    getByText('Thermocycler Module GEN1')
    getByText('ghi789')
    expect(getAllByText('Not calibrated').length).toBe(3)
    expect(getAllByText('mock ModuleCalibrationOverflowMenu').length).toBe(3)
  })

  it('should display last calibrated time if a module is calibrated', () => {
    props = {
      ...props,
      attachedModules: [mockCalibratedModule] as AttachedModule[],
    }
    const [{ getByText }] = render(props)
    getByText(formatLastCalibrated('2023-06-01T14:42:20.131798+00:00'))
  })
})
