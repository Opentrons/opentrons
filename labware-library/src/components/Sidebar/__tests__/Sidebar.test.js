// @flow
// Sidebar component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import Sidebar from '..'

jest.mock('../../../definitions')

// mock out Filter* because they depend on react-router
jest.mock('../FilterCategory', () => props =>
  `FilterCategory(${JSON.stringify(props)})`
)
jest.mock('../FilterManufacturer', () => props =>
  `FilterManufacturer(${JSON.stringify(props)})`
)

describe('Sidebar', () => {
  const filters = {category: 'all', manufacturer: 'all'}

  test('component renders', () => {
    const tree = Renderer.create(<Sidebar filters={filters} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders a <nav>', () => {
    const tree = Renderer.create(<Sidebar filters={filters} />)
    // throws if can't find 'nav'
    tree.root.findByType('nav')
  })
})
