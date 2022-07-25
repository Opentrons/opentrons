import * as React from 'react'
import { i18n } from '../../../i18n'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useRunStatuses } from '../../Devices/hooks'
import { TemperatureModuleSlideout } from '../TemperatureModuleSlideout'
import { useModuleIdFromRun } from '../useModuleIdFromRun'
import {
  mockTemperatureModule,
  mockTemperatureModuleGen2,
} from '../../../redux/modules/__fixtures__'

jest.mock('@opentrons/react-api-client')
jest.mock('../useModuleIdFromRun')
jest.mock('../../Devices/hooks')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseCommandMutation = useCreateCommandMutation as jest.MockedFunction<
  typeof useCreateCommandMutation
>
const mockUseModuleIdFromRun = useModuleIdFromRun as jest.MockedFunction<
  typeof useModuleIdFromRun
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>

const render = (
  props: React.ComponentProps<typeof TemperatureModuleSlideout>
) => {
  return renderWithProviders(<TemperatureModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TemperatureModuleSlideout', () => {
  let props: React.ComponentProps<typeof TemperatureModuleSlideout>
  let mockCreateLiveCommand = jest.fn()
  let mockCreateCommand = jest.fn()

  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)

    mockCreateCommand = jest.fn()
    mockCreateCommand.mockResolvedValue(null)
    props = {
      module: mockTemperatureModule,
      isExpanded: true,
      isLoadedInRun: false,
      onCloseClick: jest.fn(),
    }
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockUseCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)
    mockUseModuleIdFromRun.mockReturnValue({ moduleIdFromRun: 'tempdeck_id' })
    mockUseRunStatuses.mockReturnValue({
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: true,
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for a gen1 temperature module', () => {
    const { getByText } = render(props)

    getByText('Set Temperature for Temperature Module GEN1')
    getByText(
      'Pre heat or cool your Temperature Module GEN1. Enter a whole number between 4 °C and 96 °C.'
    )
    getByText('Set temperature')
  })

  it('renders correct title and body for a gen2 temperature module', () => {
    props = {
      module: mockTemperatureModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByText } = render(props)

    getByText('Set Temperature for Temperature Module GEN2')
    getByText(
      'Pre heat or cool your Temperature Module GEN2. Enter a whole number between 4 °C and 96 °C.'
    )
    getByText('Set temperature')
  })

  it('renders the button and it is not clickable until there is something in form field', () => {
    props = {
      module: mockTemperatureModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('temperatureModuleV2')
    fireEvent.change(input, { target: { value: '20' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'temperatureModule/setTargetTemperature',
        params: {
          moduleId: mockTemperatureModule.id,
          celsius: 20,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field and a run id is present', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      module: mockTemperatureModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
      currentRunId: 'tempdeck_id',
      isLoadedInRun: true,
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('temperatureModuleV2')
    fireEvent.change(input, { target: { value: '20' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateCommand).toHaveBeenCalledWith({
      runId: props.currentRunId,
      command: {
        commandType: 'temperatureModule/setTargetTemperature',
        params: {
          moduleId: mockTemperatureModule.id,
          celsius: 20,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
})
