// @flow
// FilterCategory component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import FilterCategory from '../FilterCategory'

jest.mock('react-router-dom', () => ({
  Link: props => `Link(${JSON.stringify(props)})`,
}))

jest.mock('../../../definitions')

describe('FilterCategory', () => {
  test('component renders', () => {
    const filters = {category: 'all', manufacturer: 'all'}
    const tree = Renderer.create(<FilterCategory filters={filters} />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
