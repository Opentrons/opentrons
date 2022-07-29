import * as React from 'react'
import { i18n } from '../../../i18n'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import { HeaterShakerIsRunningModal } from '../HeaterShakerIsRunningModal'
import { HeaterShakerModuleCard } from '../HeaterShakerWizard/HeaterShakerModuleCard'
import { useProtocolDetailsForRun } from '../hooks'
import { useHeaterShakerModuleIdsFromRun } from '../HeaterShakerIsRunningModal/hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('../HeaterShakerIsRunningModal/hooks')
jest.mock('../hooks')
jest.mock('../HeaterShakerWizard/HeaterShakerModuleCard')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseHeaterShakerModuleIdsFromRun = useHeaterShakerModuleIdsFromRun as jest.MockedFunction<
  typeof useHeaterShakerModuleIdsFromRun
>
const mockUseCreateCommandMutation = useCreateCommandMutation as jest.MockedFunction<
  typeof useCreateCommandMutation
>
const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>

const RUN_ID = '1'

const render = (
  props: React.ComponentProps<typeof HeaterShakerIsRunningModal>
) => {
  return renderWithProviders(<HeaterShakerIsRunningModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerIsRunningModal', () => {
  let props: React.ComponentProps<typeof HeaterShakerIsRunningModal>
  const mockCreateCommand = jest.fn()
  beforeEach(() => {
    props = {
      closeModal: jest.fn(),
      module: mockHeaterShaker,
      startRun: jest.fn(),
      currentRunId: RUN_ID,
    }
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>mock HeaterShakerModuleCard</div>
    )
    mockCreateCommand.mockResolvedValue(null)
    mockUseCreateCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
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
    mockUseHeaterShakerModuleIdsFromRun.mockReturnValue({
      moduleIdsFromRun: ['heatershaker_id'],
    })
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
    expect(mockCreateCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId: mockHeaterShaker.id,
        },
      },
      runId: RUN_ID,
    })
    expect(props.startRun).toHaveBeenCalled()
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('should call the stop shaker command twice for two heater shakers', () => {
    mockUseHeaterShakerModuleIdsFromRun.mockReturnValue({
      moduleIdsFromRun: ['heatershaker_id_1', 'heatershaker_id_2'],
    })
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: /Stop shaking and start run/i,
    })
    fireEvent.click(button)
    expect(mockCreateCommand).toHaveBeenCalledTimes(2)
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
