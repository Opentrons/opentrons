// FilterCategory component tests
import { FilterCategory } from '../FilterCategory'
import { shallow } from 'enzyme'
import * as React from 'react'

jest.mock('../../../definitions')

describe('FilterCategory', () => {
  it('component renders', () => {
    const filters = { category: 'all', manufacturer: 'all' }
    const tree = shallow(<FilterCategory filters={filters} />)

    expect(tree).toMatchSnapshot()
  })
})
