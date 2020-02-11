// @flow
// FilterManufacturer component tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { FilterManufacturerComponent } from '../FilterManufacturer'
import * as filters from '../../../filters'

jest.mock('../../../filters')

const getAllManufacturers: JestMockFn<
  empty,
  Array<string>
> = (filters.getAllManufacturers: any)

describe('FilterManufacturer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('component renders', () => {
    getAllManufacturers.mockReturnValue(['all', 'foo', 'bar', 'baz'])

    const filters = { category: 'all', manufacturer: 'all' }
    const tree = shallow(
      <FilterManufacturerComponent
        location={({}: any)}
        history={({}: any)}
        match={({}: any)}
        filters={filters}
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
