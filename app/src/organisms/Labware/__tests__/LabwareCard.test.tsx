import * as React from 'react'
import { renderWithProviders, nestedTextMatcher } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { LabwareCard } from '../LabwareCard'
import { useGetAllLabware } from '../hooks'
import { mockDefinition } from '../../../redux/custom-labware/__fixtures__'

jest.mock('../hooks')
jest.mock('../helpers/getAllDefs')
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
  }
})

const mockUseGetAllLabware = useGetAllLabware as jest.MockedFunction<
  typeof useGetAllLabware
>
const render = (props: React.ComponentProps<typeof LabwareCard>) => {
  return renderWithProviders(<LabwareCard {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LabwareCard', () => {
  let props: React.ComponentProps<typeof LabwareCard>
  beforeEach(() => {
    mockUseGetAllLabware.mockReturnValue([{ definition: mockDefinition }])
    props = {
      labware: {
        definition: mockDefinition,
      },
    }
  })

  it('renders correct info for opentrons labware card', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('mock RobotWorkSpace')
    getByText('Well Plate')
    getByText('Mock Definition')
    getByText(`Opentron's Definition`)
    getByText('API Name')
    getByRole('button', { name: 'mock_definition' })
  })

  it('renders additonal info for custom labware card', () => {
    props.labware.definition.brand.brand = 'custom'
    props.labware.modified = 123
    const [{ getByText }] = render(props)
    getByText('Custom Definition')
    getByText(nestedTextMatcher('Date added'))
  })
})
