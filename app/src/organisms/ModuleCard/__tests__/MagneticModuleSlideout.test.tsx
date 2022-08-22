import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { useRunStatuses } from '../../Devices/hooks'
import { useModuleIdFromRun } from '../useModuleIdFromRun'
import { MagneticModuleSlideout } from '../MagneticModuleSlideout'

import {
  mockMagneticModule,
  mockMagneticModuleGen2,
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

const render = (props: React.ComponentProps<typeof MagneticModuleSlideout>) => {
  return renderWithProviders(<MagneticModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('MagneticModuleSlideout', () => {
  let props: React.ComponentProps<typeof MagneticModuleSlideout>
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
    props = {
      module: mockMagneticModule,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)

    mockCreateCommand = jest.fn()
    mockCreateCommand.mockResolvedValue(null)
    mockUseCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)
    mockUseModuleIdFromRun.mockReturnValue({ moduleIdFromRun: 'magdeck_id' })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for a gen1 magnetic module', () => {
    const { getByText } = render(props)

    getByText('Set Engage Height for Magnetic Module GEN1')
    getByText(
      'Set the engage height for this Magnetic Module. Enter an integer between -2.5 and 20.'
    )
    getByText('GEN 1 Height Ranges')
    getByText('Max Engage Height')
    getByText('Labware Bottom')
    getByText('Disengaged')
    getByText('20 mm')
    getByText('0 mm')
    getByText('-2.5 mm')
    getByText('Set Engage Height')
    getByText('Confirm')
  })

  it('renders correct title and body for a gen2 magnetic module', () => {
    props = {
      module: mockMagneticModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByText } = render(props)

    getByText('Set Engage Height for Magnetic Module GEN2')
    getByText(
      'Set the engage height for this Magnetic Module. Enter an integer between -2.5 and 20.'
    )
    getByText('GEN 2 Height Ranges')
    getByText('Max Engage Height')
    getByText('Labware Bottom')
    getByText('Disengaged')
    getByText('20 mm')
    getByText('0 mm')
    getByText('-2.5 mm') // TODO(jr, 6/14/22): change this to -4 when ticket #9585 merges
    getByText('Set Engage Height')
    getByText('Confirm')
  })

  it('renders the button and it is not clickable until there is something in form field', () => {
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('magneticModuleV1')
    fireEvent.change(input, { target: { value: '10' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'magneticModule/engage',
        params: {
          moduleId: 'magdeck_id',
          height: 10,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field when there is a runId', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      module: mockMagneticModule,
      isExpanded: true,
      onCloseClick: jest.fn(),
      isLoadedInRun: true,
      currentRunId: 'test123',
    }

    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    const input = getByTestId('magneticModuleV1')
    fireEvent.change(input, { target: { value: '10' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(mockCreateCommand).toHaveBeenCalledWith({
      runId: props.currentRunId,
      command: {
        commandType: 'magneticModule/engage',
        params: {
          moduleId: 'magdeck_id',
          height: 10,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
})
