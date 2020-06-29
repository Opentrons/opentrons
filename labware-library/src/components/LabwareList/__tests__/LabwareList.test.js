// @flow
// LabwareList tests
import { shallow } from 'enzyme'
import * as React from 'react'

import { LabwareList } from '..'
import * as definitions from '../../../definitions'
import type { LabwareList as LabwareListType } from '../../../types'
import { LabwareCard } from '../LabwareCard'
import { NoResults } from '../NoResults'

jest.mock('../../../definitions')

const getAllDefinitions: JestMockFn<
  Array<void>,
  LabwareListType
> = (definitions.getAllDefinitions: any)

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

  it('renders <NoResults> without <ul> if everything filtered out', () => {
    getAllDefinitions.mockReturnValueOnce([])

    const tree = shallow(<LabwareList filters={filtersOff} />)

    expect(tree.find('ul')).toHaveLength(0)
    expect(tree.find(NoResults)).toHaveLength(1)
  })
})
