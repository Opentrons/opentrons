import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { format } from 'date-fns'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import {
  useCreateRunMutation,
  useDeleteProtocolMutation,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { ProtocolDetails } from '..'
import { Deck } from '../Deck'
import { Hardware } from '../Hardware'
import { Labware } from '../Labware'

jest.mock('@opentrons/react-api-client')
jest.mock('../Deck')
jest.mock('../Hardware')
jest.mock('../Labware')

const mockCreateRun = jest.fn((id: string) => {})
const mockDeleteProtocol = jest.fn((id: string) => {})
const mockHardware = Hardware as jest.MockedFunction<typeof Hardware>
const mockLabware = Labware as jest.MockedFunction<typeof Labware>
const mockDeck = Deck as jest.MockedFunction<typeof Deck>
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>
const mockUseDeleteProtocolMutation = useDeleteProtocolMutation as jest.MockedFunction<
  typeof useDeleteProtocolMutation
>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>

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
    mockUseDeleteProtocolMutation.mockReturnValue({
      deleteProtocol: mockDeleteProtocol,
    } as any)
    mockUseProtocolQuery.mockReturnValue({
      data: {
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
      },
    } as any)
  })

  it('renders protocol truncated name that expands when clicked', () => {
    const [{ getByText }] = render()
    const name = getByText(
      'Nextera XT DNA Library Prep Kit Protocol: Part 1/4 - Tagment Genomic ...nd Amplify Libraries'
    )
    name.click()
    getByText(
      'Nextera XT DNA Library Prep Kit Protocol: Part 1/4 - Tagment Genomic DNA and Amplify Libraries'
    )
  })
  it('renders the start setup button', () => {
    const [{ getByRole }] = render()
    getByRole('button', { name: 'Start setup' })
  })
  it('renders the protocol author', () => {
    const [{ getByText }] = render()
    getByText('engineering testing division')
  })
  it('renders the protocol description', () => {
    const [{ getByText }] = render()
    getByText('A short mock protocol')
  })
  it('renders the protocol date added', () => {
    const [{ getByText }] = render()
    getByText(
      `Date Added: ${format(
        new Date('2022-05-03T21:36:12.494778+00:00'),
        'MM/dd/yyyy k:mm'
      )}`
    )
  })
  it('renders the pin protocol button', () => {
    const [{ getByText }] = render()
    getByText('Pin protocol')
  })
  it('renders the delete protocol button', () => {
    const [{ getByText }] = render()
    getByText('Delete protocol')
  })
  it('renders the navigation buttons', () => {
    mockHardware.mockReturnValue(<div>Mock Hardware</div>)
    mockLabware.mockReturnValue(<div>Mock Labware</div>)
    mockDeck.mockReturnValue(<div>Mock Initial Deck Layout</div>)
    const [{ getByRole, getByText }] = render()
    const hardwareButton = getByRole('button', { name: 'Hardware' })
    hardwareButton.click()
    getByText('Mock Hardware')
    const labwareButton = getByRole('button', { name: 'Labware' })
    labwareButton.click()
    getByText('Mock Labware')
    // Can't test this until liquids section exists
    getByRole('button', { name: 'Liquids' })
    const deckButton = getByRole('button', { name: 'Initial Deck Layout' })
    deckButton.click()
    getByText('Mock Initial Deck Layout')
    const summaryButton = getByRole('button', { name: 'Summary' })
    summaryButton.click()
    getByText('A short mock protocol')
  })
})
