import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { LabwareCard } from '../LabwareCard'
import { AddCustomLabware } from '../AddCustomLabware'
import { useGetAllLabware } from '../hooks'
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
})
