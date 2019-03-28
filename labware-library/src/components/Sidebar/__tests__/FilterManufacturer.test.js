// @flow
// FilterManufacturer component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import {FilterManufacturer} from '../FilterManufacturer'
import * as filters from '../../../filters'

jest.mock('../../../filters', () => ({getAllManufacturers: jest.fn()}))

const getAllManufacturers: JestMockFn<empty,
  Array<string>> = (filters.getAllManufacturers: any)

describe('FilterManufacturer', () => {
  test('component renders', () => {
    getAllManufacturers.mockReturnValue(['all', 'foo', 'bar', 'baz'])

    const filters = {category: 'all', manufacturer: 'all'}
    const tree = Renderer.create(
      <FilterManufacturer
        location={({}: any)}
        history={({}: any)}
        match={({}: any)}
        filters={filters}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
