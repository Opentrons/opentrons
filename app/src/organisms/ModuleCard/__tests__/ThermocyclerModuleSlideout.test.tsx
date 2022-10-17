import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { useRunStatuses } from '../../Devices/hooks'
import { useModuleIdFromRun } from '../useModuleIdFromRun'
import { ThermocyclerModuleSlideout } from '../ThermocyclerModuleSlideout'

import { mockThermocycler } from '../../../redux/modules/__fixtures__'

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
  props: React.ComponentProps<typeof ThermocyclerModuleSlideout>
) => {
  return renderWithProviders(<ThermocyclerModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ThermocyclerModuleSlideout', () => {
  let props: React.ComponentProps<typeof ThermocyclerModuleSlideout>
  let mockCreateLiveCommand = jest.fn()
  let mockCreateCommand = jest.fn()
  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)

    mockCreateCommand = jest.fn()
    mockCreateCommand.mockResolvedValue(null)
    mockUseCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)
    mockUseModuleIdFromRun.mockReturnValue({
      moduleIdFromRun: 'thermocycler_id',
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for Thermocycler Lid temperature', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByText } = render(props)

    getByText('Set Lid Temperature for Thermocycler Module GEN1')
    getByText(
      'Pre heat or cool your Thermocycler Lid. Enter a whole number between 37 °C and 110 °C.'
    )
    getByText('Set lid temperature')
    getByText('Confirm')
  })

  it('renders correct title and body for Thermocycler Block Temperature', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByText } = render(props)

    getByText('Set Block Temperature for Thermocycler Module GEN1')
    getByText(
      'Pre heat or cool your Thermocycler Block. Enter a whole number between 4 °C and 99 °C.'
    )
    getByText('Set block temperature')
    getByText('Confirm')
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Block', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('thermocyclerModuleV1_false')
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/setTargetBlockTemperature',
        params: {
          moduleId: mockThermocycler.id,
          celsius: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Lid', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('thermocyclerModuleV1_true')
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/setTargetLidTemperature',
        params: {
          moduleId: mockThermocycler.id,
          celsius: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the exit button and when clicked, deletes the value input', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByLabelText, getByTestId } = render(props)
    const button = getByLabelText('exit')
    const input = getByTestId('thermocyclerModuleV1_true')
    fireEvent.change(input, { target: { value: '45' } })
    fireEvent.click(button)

    expect(props.onCloseClick).toHaveBeenCalled()
    expect(input).not.toHaveValue()
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Block when there is a runId', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
      currentRunId: 'test123',
      isLoadedInRun: true,
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('thermocyclerModuleV1_false')
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateCommand).toHaveBeenCalledWith({
      runId: props.currentRunId,
      command: {
        commandType: 'thermocycler/setTargetBlockTemperature',
        params: {
          moduleId: mockThermocycler.id,
          celsius: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Lid when there is a runId', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: true,
      currentRunId: 'test123',
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('thermocyclerModuleV1_true')
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateCommand).toHaveBeenCalledWith({
      runId: props.currentRunId,
      command: {
        commandType: 'thermocycler/setTargetLidTemperature',
        params: {
          moduleId: mockThermocycler.id,
          celsius: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
})
