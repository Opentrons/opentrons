import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'

import {
  useCreateLiveCommandMutation,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/4/ot3_standard.json'

import { i18n } from '../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getProtocolModulesInfo } from '../../Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupLabware } from '..'
import {
  mockProtocolModuleInfo,
  mockRecentAnalysis,
  mockUseModulesQueryClosed,
  mockUseModulesQueryClosing,
  mockUseModulesQueryOpen,
  mockUseModulesQueryOpening,
  mockUseModulesQueryUnknown,
} from '../__fixtures__'

jest.mock('@opentrons/react-api-client')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../Devices/ProtocolRun/utils/getProtocolModulesInfo')

const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>

const RUN_ID = "otie's run"
const mockSetSetupScreen = jest.fn()
const mockRefetch = jest.fn()
const mockCreateLiveCommand = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolSetupLabware
        runId={RUN_ID}
        setSetupScreen={mockSetSetupScreen}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolSetupLabware', () => {
  beforeEach(() => {
    mockCreateLiveCommand.mockResolvedValue(null)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRecentAnalysis)
    when(mockGetProtocolModulesInfo)
      .calledWith(mockRecentAnalysis, ot3StandardDeckDef as any)
      .mockReturnValue(mockProtocolModuleInfo)
    mockUseModulesQuery.mockReturnValue({
      ...mockUseModulesQueryOpen,
      refetch: mockRefetch,
    } as any)
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders the Labware Setup page', () => {
    render()
    screen.getByText('Labware')
    screen.getByText('Labware name')
    screen.getByText('Location')
    screen.getByRole('button', { name: 'Map View' })
  })

  it('correctly navigates with the nav button', () => {
    render()
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(mockSetSetupScreen).toHaveBeenCalledWith('prepare to run')
  })

  it('should launch and close the deck map', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Map View' }))
    fireEvent.click(screen.getByLabelText('closeIcon'))
    screen.getByText('Labware')
  })

  it('sends a latch-close command when the labware latch is open and the button is clicked', () => {
    render()
    fireEvent.click(screen.getByText('Labware Latch'))
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: {
          moduleId: '8bcc37fdfcb4c2b5ab69963c589ceb1f9b1d1c4f',
        },
      },
      waitUntilComplete: true,
    })
  })

  it('sends a latch-open command when the labware latch is closed and the button is clicked', () => {
    mockUseModulesQuery.mockReturnValue({
      ...mockUseModulesQueryClosed,
      refetch: mockRefetch,
    } as any)
    render()
    fireEvent.click(screen.getByText('Labware Latch'))
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/openLabwareLatch',
        params: {
          moduleId: '8bcc37fdfcb4c2b5ab69963c589ceb1f9b1d1c4f',
        },
      },
      waitUntilComplete: true,
    })
  })

  it('shows opening transition states of the labware latch button', () => {
    mockUseModulesQuery.mockReturnValue(mockUseModulesQueryOpening as any)

    render()
    screen.getByText('Opening...')
  })

  it('shows closing transition state of the labware latch button', () => {
    mockUseModulesQuery.mockReturnValue(mockUseModulesQueryClosing as any)

    render()
    screen.getByText('Closing...')
  })

  it('defaults to open when latch status is unknown', () => {
    mockUseModulesQuery.mockReturnValue(mockUseModulesQueryUnknown as any)

    render()
    screen.getByText('Open')
  })
})
