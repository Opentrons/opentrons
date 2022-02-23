// LabwareList tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { LabwareList } from '..'
import { LabwareCard } from '../LabwareCard'
import { getAllDefinitions } from '@opentrons/shared-data'
// how do I mock this properly??
jest.mock('@opentrons/shared-data')

const mockGetAllDefinitions = getAllDefinitions as jest.MockedFunction<
  typeof getAllDefinitions
>

const filtersOff = { category: 'all', manufacturer: 'all' }

describe('LabwareList', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('component renders', () => {
    const tree = shallow(<LabwareList filters={filtersOff} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders a <ul>', () => {
    const tree = shallow(<LabwareList filters={filtersOff} />)

    expect(tree.find('ul')).toHaveLength(1)
  })

  it('renders a LabwareCard per labware definition', () => {
    const tree = shallow(<LabwareList filters={filtersOff} />)

    expect(tree.find(LabwareCard)).toHaveLength(mockGetAllDefinitions().length)
  })
})
