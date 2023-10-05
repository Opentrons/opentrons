import * as React from 'react'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ModuleWizardFlows } from '../../../ModuleWizardFlows'
import { useChainLiveCommands } from '../../../../resources/runs/hooks'
import { mockThermocyclerGen2 } from '../../../../redux/modules/__fixtures__'
import { useRunStatuses } from '../../../Devices/hooks'
import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'

import type { Mount } from '@opentrons/components'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ModuleWizardFlows')
jest.mock('../../../Devices/hooks')
jest.mock('../../../../resources/runs/hooks')
const mockPipetteOffsetCalibrations = [
  {
    modelName: 'mockPipetteModelLeft',
    serialNumber: '1234567',
    mount: 'left' as Mount,
    tiprack: 'mockTiprackLeft',
    lastCalibrated: '2022-11-10T18:14:01',
    markedBad: false,
  },
  {
    modelName: 'mockPipetteModelRight',
    serialNumber: '01234567',
    mount: 'right' as Mount,
    tiprack: 'mockTiprackRight',
    lastCalibrated: '2022-11-10T18:15:02',
    markedBad: false,
  },
]

const mockHotHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    currentTemperature: 80,
  },
} as any

const mockMovingHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    currentSpeed: 200,
  },
} as any

const mockTemperatureModuleHeating = {
  id: 'tempdeck_id',
  moduleModel: 'temperatureModuleV2',
  moduleType: 'temperatureModuleType',
  hasAvailableUpdate: true,
  data: {
    currentTemp: 25,
    targetTemp: null,
    status: 'heating',
  },
} as any

const mockTCHeating = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  hasAvailableUpdate: true,
  data: {
    lid: 'closed',
    lidTargetTemperature: 50,
    lidTemperature: 40,
    targetTemperature: 45,
    status: 'heating',
  },
} as any

const mockModuleWizardFlows = ModuleWizardFlows as jest.MockedFunction<
  typeof ModuleWizardFlows
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockUseChainLiveCommands = useChainLiveCommands as jest.MockedFunction<
  typeof useChainLiveCommands
>

const render = (
  props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>
) => {
  return renderWithProviders(<ModuleCalibrationOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ModuleCalibrationOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>
  let mockChainLiveCommands = jest.fn()

  beforeEach(() => {
    props = {
      isCalibrated: false,
      attachedModule: mockThermocyclerGen2,
      updateRobotStatus: jest.fn(),
      formattedPipetteOffsetCalibrations: mockPipetteOffsetCalibrations,
    }
    mockChainLiveCommands = jest.fn()
    mockChainLiveCommands.mockResolvedValue(null)
    mockModuleWizardFlows.mockReturnValue(<div>module wizard flows</div>)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: false,
    })
    mockUseChainLiveCommands.mockReturnValue({
      chainLiveCommands: mockChainLiveCommands,
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render overflow menu buttons - not calibrated', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module')
  })

  it('should render overflow menu buttons - calibrated', () => {
    props = { ...props, isCalibrated: true }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Recalibrate module')
  })

  it('should call a mock function when clicking calibrate button', async () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module').click()
    await waitFor(() => {
      getByText('module wizard flows')
    })
  })

  it('should have a disabled button when heater shaker is hot', () => {
    props = {
      ...props,
      attachedModule: mockHotHeaterShaker,
    }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    expect(getByText('Calibrate module')).toBeDisabled()
  })

  it('should call a mock function when clicking calibrate button for moving heater-shaker calling stop shaking and open latch command', async () => {
    props = {
      ...props,
      attachedModule: mockMovingHeaterShaker,
    }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module').click()
    await waitFor(() => {
      expect(mockChainLiveCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'heaterShaker/closeLabwareLatch',
            params: {
              moduleId: mockMovingHeaterShaker.id,
            },
          },
          {
            commandType: 'heaterShaker/deactivateHeater',
            params: {
              moduleId: mockMovingHeaterShaker.id,
            },
          },
          {
            commandType: 'heaterShaker/deactivateShaker',
            params: {
              moduleId: mockMovingHeaterShaker.id,
            },
          },
          {
            commandType: 'heaterShaker/openLabwareLatch',
            params: {
              moduleId: mockMovingHeaterShaker.id,
            },
          },
        ],
        false
      )
    })
    getByText('module wizard flows')
  })

  it('should call a mock function when clicking calibrate button for heated temp module', async () => {
    props = {
      ...props,
      attachedModule: mockTemperatureModuleHeating,
    }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module').click()
    await waitFor(() => {
      expect(mockChainLiveCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'temperatureModule/deactivate',
            params: {
              moduleId: mockTemperatureModuleHeating.id,
            },
          },
        ],
        false
      )
    })
    getByText('module wizard flows')
  })

  it('should call a mock function when clicking calibrate button for heated TC module with lid closed', async () => {
    props = {
      ...props,
      attachedModule: mockTCHeating,
    }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module').click()
    await waitFor(() => {
      expect(mockChainLiveCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'thermocycler/deactivateLid',
            params: {
              moduleId: mockTCHeating.id,
            },
          },
          {
            commandType: 'thermocycler/deactivateBlock',
            params: {
              moduleId: mockTCHeating.id,
            },
          },
          {
            commandType: 'thermocycler/openLid',
            params: {
              moduleId: mockTCHeating.id,
            },
          },
        ],
        false
      )
    })
    getByText('module wizard flows')
  })

  it('should be disabled when not calibrated module and pipette is not attached', () => {
    props.formattedPipetteOffsetCalibrations = [] as any
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    expect(getByText('Calibrate module')).toBeDisabled()
  })

  it('should be disabled when not calibrated module and pipette is not calibrated', () => {
    props.formattedPipetteOffsetCalibrations[0].lastCalibrated = undefined
    props.formattedPipetteOffsetCalibrations[1].lastCalibrated = undefined
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    expect(getByText('Calibrate module')).toBeDisabled()
  })

  it('should be disabled when running', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: true,
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: false,
    })
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    expect(getByText('Calibrate module')).toBeDisabled()
  })
})
