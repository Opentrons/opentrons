// LabwareList tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { LabwareList } from '..'
import { LabwareCard } from '../LabwareCard'
import * as definitions from '../../../definitions'

jest.mock('../../../definitions')

const getAllDefinitions = definitions.getAllDefinitions as jest.MockedFunction<
  typeof definitions.getAllDefinitions
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

    expect(tree.find(LabwareCard)).toHaveLength(getAllDefinitions().length)
  })
})
