import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { LabwareCard } from '../LabwareCard'
import { useGetAllLabware } from '../hooks'
import { Labware } from '../'
import { mockDefinition } from '../../../redux/custom-labware/__fixtures__'

jest.mock('../LabwareCard')
jest.mock('../hooks')
jest.mock('@opentrons/shared-data/js/labwareTools/getAllDefs')

const mockLabwareCard = LabwareCard as jest.MockedFunction<typeof LabwareCard>
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
    mockUseGetAllLabware.mockReturnValue([{ definition: mockDefinition }])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and labware cards', () => {
    const [{ getByText }] = render()
    getByText('labware')
    getByText('Mock Labware Card')
  })
})
