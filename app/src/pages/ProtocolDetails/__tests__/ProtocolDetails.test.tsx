import * as React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import {
  deleteProtocol,
  deleteRun,
  getProtocol,
  HostConfig,
} from '@opentrons/api-client'
import {
  useCreateRunMutation,
  useHost,
  useProtocolQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { useHardwareStatusText } from '../../../organisms/OnDeviceDisplay/RobotDashboard/hooks'
import { useOffsetCandidatesForAnalysis } from '../../../organisms/ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import { useMissingProtocolHardware } from '../../Protocols/hooks'
import { formatTimeWithUtcLabel } from '../../../resources/runs/utils'
import { ProtocolDetails } from '..'
import { Deck } from '../Deck'
import { Hardware } from '../Hardware'
import { Labware } from '../Labware'

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
})

jest.mock('@opentrons/api-client')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/OnDeviceDisplay/RobotDashboard/hooks')
jest.mock(
  '../../../organisms/ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
)
jest.mock('../../Protocols/hooks')
jest.mock('../Deck')
jest.mock('../Hardware')
jest.mock('../Labware')

const MOCK_HOST_CONFIG = {} as HostConfig
const mockCreateRun = jest.fn((id: string) => {})
const mockHardware = Hardware as jest.MockedFunction<typeof Hardware>
const mockLabware = Labware as jest.MockedFunction<typeof Labware>
const mockDeck = Deck as jest.MockedFunction<typeof Deck>
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>
const mockuseHost = useHost as jest.MockedFunction<typeof useHost>
const mockGetProtocol = getProtocol as jest.MockedFunction<typeof getProtocol>
const mockDeleteProtocol = deleteProtocol as jest.MockedFunction<
  typeof deleteProtocol
>
const mockDeleteRun = deleteRun as jest.MockedFunction<typeof deleteRun>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseProtocolAnalysisAsDocumentQuery = useProtocolAnalysisAsDocumentQuery as jest.MockedFunction<
  typeof useProtocolAnalysisAsDocumentQuery
>
const mockUseMissingProtocolHardware = useMissingProtocolHardware as jest.MockedFunction<
  typeof useMissingProtocolHardware
>
const mockUseOffsetCandidatesForAnalysis = useOffsetCandidatesForAnalysis as jest.MockedFunction<
  typeof useOffsetCandidatesForAnalysis
>

const mockUseHardwareStatusText = useHardwareStatusText as jest.MockedFunction<
  typeof useHardwareStatusText
>

const MOCK_DATA = {
  data: {
    id: 'mockProtocol1',
    createdAt: '2022-05-03T21:36:12.494778+00:00',
    protocolType: 'json',
    metadata: {
      protocolName:
        'Nextera XT DNA Library Prep Kit Protocol: Part 1/4 - Tagment Genomic DNA and Amplify Libraries',
      author: 'engineering testing division',
      description: 'A short mock protocol',
      created: 1606853851893,
      tags: ['unitTest'],
    },
    analysisSummaries: [],
    files: [],
    key: '26ed5a82-502f-4074-8981-57cdda1d066d',
  },
}

const render = (path = '/protocols/fakeProtocolId') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/protocols/:protocolId">
        <ProtocolDetails />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ODDProtocolDetails', () => {
  beforeEach(() => {
    mockUseCreateRunMutation.mockReturnValue({
      createRun: mockCreateRun,
    } as any)
    mockUseHardwareStatusText.mockReturnValue('mock missing hardware chip text')
    mockUseOffsetCandidatesForAnalysis.mockReturnValue([])
    mockUseMissingProtocolHardware.mockReturnValue({
      missingProtocolHardware: [],
      isLoading: false,
      conflictedSlots: [],
    })
    mockUseProtocolQuery.mockReturnValue({
      data: MOCK_DATA,
      isLoading: false,
    } as any)
    mockUseProtocolAnalysisAsDocumentQuery.mockReturnValue({
      data: {
        id: 'mockAnalysisId',
        status: 'completed',
      },
    } as any)
    when(mockuseHost).calledWith().mockReturnValue(MOCK_HOST_CONFIG)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders protocol truncated name that expands when clicked', () => {
    render()
    const name = screen.getByText(
      'Nextera XT DNA Library Prep Kit Protocol: Part 1/4 - Tagment...Amplify Libraries'
    )
    fireEvent.click(name)
    screen.getByText(
      'Nextera XT DNA Library Prep Kit Protocol: Part 1/4 - Tagment Genomic DNA and Amplify Libraries'
    )
  })
  it('renders the start setup button', () => {
    render()
    screen.getByText('Start setup')
  })
  it('renders the protocol author', () => {
    render()
    screen.getByText('engineering testing division')
  })
  it('renders the protocol description', () => {
    render()
    screen.getByText('A short mock protocol')
  })
  it('renders the protocol date added', () => {
    render()
    screen.getByText(
      `Date Added: ${formatTimeWithUtcLabel(
        '2022-05-03T21:36:12.494778+00:00'
      )}`
    )
  })
  it('renders the pin protocol button', () => {
    render()
    screen.getByText('Pin protocol')
  })
  it('renders the delete protocol button', async () => {
    when(mockGetProtocol)
      .calledWith(MOCK_HOST_CONFIG, 'fakeProtocolId')
      .mockResolvedValue({
        data: { links: { referencingRuns: [{ id: '1' }, { id: '2' }] } },
      } as any)
    render()
    const deleteButton = screen.getByRole('button', { name: 'Delete protocol' })
    fireEvent.click(deleteButton)
    const confirmDeleteButton = screen.getByText('Delete')
    fireEvent.click(confirmDeleteButton)
    await waitFor(() =>
      expect(mockDeleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '1')
    )
    await waitFor(() =>
      expect(mockDeleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '2')
    )
    await waitFor(() =>
      expect(mockDeleteProtocol).toHaveBeenCalledWith(
        MOCK_HOST_CONFIG,
        'fakeProtocolId'
      )
    )
  })
  it('renders the navigation buttons', () => {
    mockHardware.mockReturnValue(<div>Mock Hardware</div>)
    mockLabware.mockReturnValue(<div>Mock Labware</div>)
    mockDeck.mockReturnValue(<div>Mock Initial Deck Layout</div>)
    render()
    const hardwareButton = screen.getByRole('button', { name: 'Hardware' })
    fireEvent.click(hardwareButton)
    screen.getByText('Mock Hardware')
    const labwareButton = screen.getByRole('button', { name: 'Labware' })
    fireEvent.click(labwareButton)
    screen.getByText('Mock Labware')
    // Can't test this until liquids section exists
    screen.getByRole('button', { name: 'Liquids' })
    const deckButton = screen.getByRole('button', { name: 'Deck' })
    fireEvent.click(deckButton)
    screen.getByText('Mock Initial Deck Layout')
    const summaryButton = screen.getByRole('button', { name: 'Summary' })
    fireEvent.click(summaryButton)
    screen.getByText('A short mock protocol')
  })
  it('should render a loading skeleton while awaiting a response from the server', () => {
    mockUseProtocolQuery.mockReturnValue({
      data: MOCK_DATA,
      isLoading: true,
    } as any)
    render()
    expect(screen.getAllByTestId('Skeleton').length).toBeGreaterThan(0)
  })
})
