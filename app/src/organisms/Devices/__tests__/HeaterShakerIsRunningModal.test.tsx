import * as React from 'react'
import { i18n } from '../../../i18n'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import { HeaterShakerIsRunningModal } from '../HeaterShakerIsRunningModal'
import { HeaterShakerModuleCard } from '../HeaterShakerWizard/HeaterShakerModuleCard'
import { useAttachedModules, useProtocolDetailsForRun } from '../hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('../hooks')
jest.mock('../HeaterShakerWizard/HeaterShakerModuleCard')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>

const mockMovingHeaterShakerOne = {
  id: 'heatershaker_id_1',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockMovingHeaterShakerTwo = {
  id: 'heatershaker_id_2',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const render = (
  props: React.ComponentProps<typeof HeaterShakerIsRunningModal>
) => {
  return renderWithProviders(<HeaterShakerIsRunningModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerIsRunningModal', () => {
  let props: React.ComponentProps<typeof HeaterShakerIsRunningModal>
  let mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    props = {
      closeModal: jest.fn(),
      module: mockHeaterShaker,
      startRun: jest.fn(),
    }
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>mock HeaterShakerModuleCard</div>
    )
    mockUseAttachedModules.mockReturnValue([mockMovingHeaterShakerOne])
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: {
        pipettes: {},
        labware: {},
        modules: {
          heatershaker_id: {
            model: 'heaterShakerModuleV1',
          },
        },
        labwareDefinitions: {},
        commands: [
          {
            id: '1f949fc0-bafe-4e24-bc76-15fc4cd1686f',
            createdAt: '2022-07-27T22:26:33.846399+00:00',
            commandType: 'loadModule',
            key: '286d7201-bfdc-4c2c-ae67-544367dbbabe',
            status: 'succeeded',
            params: {
              model: 'heaterShakerModuleV1',
              location: {
                slotName: '1',
              },
              moduleId: 'heatershaker_id',
            },
            result: {
              moduleId: 'heatershaker_id',
              definition: {},
              model: 'heaterShakerModuleV1',
              serialNumber:
                'fake-serial-number-fc4994f5-9d8d-4c12-92ef-e82f7d64f0a4',
            },
            startedAt: '2022-07-27T22:26:33.875106+00:00',
            completedAt: '2022-07-27T22:26:33.878079+00:00',
          },
        ],
      },
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the correct modal icon and title', () => {
    const { getByText, getByTestId } = render(props)

    getByTestId('HeaterShakerIsRunning_warning_icon')
    getByText('Heater-Shaker Module is currently shaking')
  })

  it('renders the heater shaker module card and prompt', () => {
    const { getByText } = render(props)

    getByText('mock HeaterShakerModuleCard')
    getByText('Continue shaking while the protocol starts?')
  })

  it('renders the stop shaking and start run button and calls the stop run command', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: /Stop shaking and start run/i,
    })
    fireEvent.click(button)
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId: mockMovingHeaterShakerOne.id,
        },
      },
    })
    expect(props.startRun).toHaveBeenCalled()
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('should call the stop shaker command twice for two heater shakers', () => {
    mockUseAttachedModules.mockReturnValue([
      mockMovingHeaterShakerOne,
      mockMovingHeaterShakerTwo,
    ])
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: /Stop shaking and start run/i,
    })
    fireEvent.click(button)
    expect(mockCreateLiveCommand).toHaveBeenCalledTimes(2)
  })

  it('renders the keep shaking and start run button and calls startRun and closeModal', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: /Keep shaking and start run/i,
    })
    fireEvent.click(button)
    expect(props.startRun).toHaveBeenCalled()
    expect(props.closeModal).toHaveBeenCalled()
  })
})
