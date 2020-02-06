// @flow
// FilterCategory component tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { FilterCategory } from '../FilterCategory'

jest.mock('../../../definitions')

describe('FilterCategory', () => {
  test('component renders', () => {
    const filters = { category: 'all', manufacturer: 'all' }
    const tree = shallow(<FilterCategory filters={filters} />)

    expect(tree).toMatchSnapshot()
  })
})
