import * as React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { when, resetAllWhenMocks } from 'jest-when'

import { i18n } from '../../../../i18n'
import { ModuleWizardFlows } from '../../../ModuleWizardFlows'
import { useChainLiveCommands } from '../../../../resources/runs/hooks'
import { mockThermocyclerGen2 } from '../../../../redux/modules/__fixtures__'
import { useRunStatuses } from '../../../Devices/hooks'
import { useIsEstopNotDisengaged } from '../../../../resources/devices/hooks/useIsEstopNotDisengaged'

import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'

import type { Mount } from '@opentrons/components'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ModuleWizardFlows')
jest.mock('../../../Devices/hooks')
jest.mock('../../../../resources/runs/hooks')
jest.mock('../../../../resources/devices/hooks/useIsEstopNotDisengaged')

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
const mockUseIsEstopNotDisengaged = useIsEstopNotDisengaged as jest.MockedFunction<
  typeof useIsEstopNotDisengaged
>

const render = (
  props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>
) => {
  return renderWithProviders(<ModuleCalibrationOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

const ROBOT_NAME = 'mockRobot'

describe('ModuleCalibrationOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>
  let mockChainLiveCommands = jest.fn()

  beforeEach(() => {
    props = {
      isCalibrated: false,
      attachedModule: mockThermocyclerGen2,
      updateRobotStatus: jest.fn(),
      formattedPipetteOffsetCalibrations: mockPipetteOffsetCalibrations,
      robotName: ROBOT_NAME,
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
    when(mockUseIsEstopNotDisengaged)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  it('should render overflow menu buttons - not calibrated', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    screen.getByText('Calibrate module')
  })

  it('should render overflow menu buttons - calibrated', () => {
    props = { ...props, isCalibrated: true }
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    screen.getByText('Recalibrate module')
  })

  it('should call a mock function when clicking calibrate button', async () => {
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    fireEvent.click(screen.getByText('Calibrate module'))
    await waitFor(() => {
      screen.getByText('module wizard flows')
    })
  })

  it('should have a disabled button when heater shaker is hot', () => {
    props = {
      ...props,
      attachedModule: mockHotHeaterShaker,
    }
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    expect(screen.getByText('Calibrate module')).toBeDisabled()
  })

  it('should call a mock function when clicking calibrate button for moving heater-shaker calling stop shaking and open latch command', async () => {
    props = {
      ...props,
      attachedModule: mockMovingHeaterShaker,
    }
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    fireEvent.click(screen.getByText('Calibrate module'))
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
    screen.getByText('module wizard flows')
  })

  it('should call a mock function when clicking calibrate button for heated temp module', async () => {
    props = {
      ...props,
      attachedModule: mockTemperatureModuleHeating,
    }
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    fireEvent.click(screen.getByText('Calibrate module'))
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
    screen.getByText('module wizard flows')
  })

  it('should call a mock function when clicking calibrate button for heated TC module with lid closed', async () => {
    props = {
      ...props,
      attachedModule: mockTCHeating,
    }
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    fireEvent.click(screen.getByText('Calibrate module'))
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
    screen.getByText('module wizard flows')
  })

  it('should be disabled when not calibrated module and pipette is not attached', () => {
    props.formattedPipetteOffsetCalibrations = [] as any
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    expect(screen.getByText('Calibrate module')).toBeDisabled()
  })

  it('should be disabled when not calibrated module and pipette is not calibrated', () => {
    props.formattedPipetteOffsetCalibrations[0].lastCalibrated = undefined
    props.formattedPipetteOffsetCalibrations[1].lastCalibrated = undefined
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    expect(screen.getByText('Calibrate module')).toBeDisabled()
  })

  it('should be disabled when running', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: true,
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: false,
    })
    render(props)
    fireEvent.click(screen.getByLabelText('ModuleCalibrationOverflowMenu'))
    expect(screen.getByText('Calibrate module')).toBeDisabled()
  })

  it('should be disabled when e-stop button is pressed', () => {
    when(mockUseIsEstopNotDisengaged)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(true)
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('ModuleCalibrationOverflowMenu')).toBeDisabled()
  })
})
