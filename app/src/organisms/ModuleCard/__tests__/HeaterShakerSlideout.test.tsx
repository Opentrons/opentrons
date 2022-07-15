import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import { useRunStatuses } from '../../Devices/hooks'
import { useModuleIdFromRun } from '../useModuleIdFromRun'
import { HeaterShakerSlideout } from '../HeaterShakerSlideout'
import { ConfirmAttachmentModal } from '../ConfirmAttachmentModal'

jest.mock('@opentrons/react-api-client')
jest.mock('../ConfirmAttachmentModal')
jest.mock('../../../redux/config')
jest.mock('../useModuleIdFromRun')
jest.mock('../../Devices/hooks')

const mockGetIsHeaterShakerAttached = getIsHeaterShakerAttached as jest.MockedFunction<
  typeof getIsHeaterShakerAttached
>
const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseCommandMutation = useCreateCommandMutation as jest.MockedFunction<
  typeof useCreateCommandMutation
>
const mockConfirmAttachmentModal = ConfirmAttachmentModal as jest.MockedFunction<
  typeof ConfirmAttachmentModal
>
const mockUseModuleIdFromRun = useModuleIdFromRun as jest.MockedFunction<
  typeof useModuleIdFromRun
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>

const render = (props: React.ComponentProps<typeof HeaterShakerSlideout>) => {
  return renderWithProviders(<HeaterShakerSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerSlideout', () => {
  let props: React.ComponentProps<typeof HeaterShakerSlideout>
  let mockCreateLiveCommand = jest.fn()
  let mockCreateCommand = jest.fn()

  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseRunStatuses.mockReturnValue({
      isLegacySessionInProgress: false,
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })
    mockGetIsHeaterShakerAttached.mockReturnValue(false)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)

    mockCreateCommand = jest.fn()
    mockCreateCommand.mockResolvedValue(null)
    mockUseCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)

    mockConfirmAttachmentModal.mockReturnValue(
      <div>mock confirm attachment modal</div>
    )
    mockUseModuleIdFromRun.mockReturnValue({
      moduleIdFromRun: 'heatershaker_id',
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for Heater shaker set shake', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByText } = render(props)

    getByText('Set shake speed for Heater-Shaker Module GEN1')
    getByText('Set rpm for this module.')
    getByText('Confirm')
  })

  it('renders correct title and body for heatershaker set temperature', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByText } = render(props)

    getByText('Set Temperature for Heater-Shaker Module GEN1')
    getByText(
      'Set target temperature. This module actively heats but cools passively to room temperature.'
    )
    getByText('Confirm')
  })

  it('renders the button and it is not clickable until there is something in form field for set shake', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole, getByTestId, getByText } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('heaterShakerModuleV1_true')
    fireEvent.change(input, { target: { value: '300' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    getByText('mock confirm attachment modal')
  })

  it('renders the button and it is not clickable until there is something in form field for set temp', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('heaterShakerModuleV1_false')
    fireEvent.change(input, { target: { value: '40' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/setTargetTemperature',
        params: {
          moduleId: 'heatershaker_id',
          celsius: 40,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the exit button and when clicked, deletes the value input', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByLabelText, getByTestId } = render(props)
    const button = getByLabelText('exit')
    const input = getByTestId('heaterShakerModuleV1_false')
    fireEvent.change(input, { target: { value: '40' } })
    fireEvent.click(button)

    expect(props.onCloseClick).toHaveBeenCalled()
    expect(input).not.toHaveValue()
  })

  it('renders heater shaker form field and when button is clicked, confirm attachment modal is not rendered', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    props = {
      module: mockHeaterShaker,
      isSetShake: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('heaterShakerModuleV1_true')
    fireEvent.change(input, { target: { value: '300' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('renders the button and it is not clickable until there is something in form field for set shake when there is a runId', () => {
    mockUseRunStatuses.mockReturnValue({
      isLegacySessionInProgress: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      module: mockHeaterShaker,
      isSetShake: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: true,
      currentRunId: 'test123',
    }

    const { getByRole, getByTestId, getByText } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('heaterShakerModuleV1_true')
    fireEvent.change(input, { target: { value: '300' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    getByText('mock confirm attachment modal')
  })

  it('renders the button and it is not clickable until there is something in form field for set temp when there is a runId', () => {
    mockUseRunStatuses.mockReturnValue({
      isLegacySessionInProgress: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      module: mockHeaterShaker,
      isSetShake: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: true,
      currentRunId: 'test123',
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('heaterShakerModuleV1_false')
    fireEvent.change(input, { target: { value: '40' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()

    expect(mockCreateCommand).toHaveBeenCalledWith({
      runId: props.currentRunId,
      command: {
        commandType: 'heaterShaker/setTargetTemperature',
        params: {
          moduleId: 'heatershaker_id',
          celsius: 40,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
})
