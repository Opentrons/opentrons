// @flow
// FilterManufacturer component tests
import { shallow } from 'enzyme'
import * as React from 'react'

import * as filters from '../../../filters'
import { FilterManufacturerComponent } from '../FilterManufacturer'

jest.mock('../../../filters')

const getAllManufacturers: JestMockFn<
  empty,
  Array<string>
> = (filters.getAllManufacturers: any)

describe('FilterManufacturer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('component renders', () => {
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
