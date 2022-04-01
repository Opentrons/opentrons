import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { LabwareCard } from '../LabwareCard'
import { AddCustomLabware } from '../AddCustomLabware'
import {
  useGetAllLabware,
  useLabwareFailure,
  useNewLabwareName,
} from '../hooks'
import { Labware } from '../'
import { mockDefinition } from '../../../redux/custom-labware/__fixtures__'

jest.mock('../LabwareCard')
jest.mock('../AddCustomLabware')
jest.mock('../hooks')
jest.mock('../helpers/getAllDefs')

const mockLabwareCard = LabwareCard as jest.MockedFunction<typeof LabwareCard>
const mockAddCustomLabware = AddCustomLabware as jest.MockedFunction<
  typeof AddCustomLabware
>
const mockUseGetAllLabware = useGetAllLabware as jest.MockedFunction<
  typeof useGetAllLabware
>
const mockUseLabwareFailure = useLabwareFailure as jest.MockedFunction<
  typeof useLabwareFailure
>
const mockUseNewLabwareName = useNewLabwareName as jest.MockedFunction<
  typeof useNewLabwareName
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Labware />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Labware', () => {
  beforeEach(() => {
    mockLabwareCard.mockReturnValue(<div>Mock Labware Card</div>)
    mockAddCustomLabware.mockReturnValue(<div>Mock Add Custom Labware</div>)
    mockUseGetAllLabware.mockReturnValue([{ definition: mockDefinition }])
    mockUseLabwareFailure.mockReturnValue({
      labwareFailureMessage: null,
      clearLabwareFailure: jest.fn(),
    })
    mockUseNewLabwareName.mockReturnValue({
      newLabwareName: null,
      clearLabwareName: jest.fn(),
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title, import button and labware cards', () => {
    const [{ getByText, getByRole }] = render()
    getByText('labware')
    getByText('Mock Labware Card')
    getByRole('button', { name: 'Import' })
  })
  it('renders AddCustomLabware slideout when import button is clicked', () => {
    const [{ getByText, getByRole, queryByText }] = render()
    expect(queryByText('Mock Add Custom Labware')).not.toBeInTheDocument()
    const importButton = getByRole('button', { name: 'Import' })
    fireEvent.click(importButton)
    getByText('Mock Add Custom Labware')
  })
  it('renders footer with labware creator link', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Create a new labware definition')
    getByRole('link', { name: 'Open Labware Creator' })
  })
  it('renders error toast if there is a failure', () => {
    mockUseLabwareFailure.mockReturnValue({
      labwareFailureMessage: 'mock failure message',
      clearLabwareFailure: jest.fn(),
    })
    const [{ getByText }] = render()
    getByText('mock failure message')
  })
  it('renders success toast if there is a new labware name', () => {
    mockUseNewLabwareName.mockReturnValue({
      newLabwareName: 'mock filename',
      clearLabwareName: jest.fn(),
    })
    const [{ getByText }] = render()
    getByText('mock filename imported.')
  })
})
