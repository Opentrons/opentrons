// @flow
// Sidebar component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import Sidebar from '..'

describe('Sidebar', () => {
  test('component renders', () => {
    const tree = Renderer.create(<Sidebar />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders a <nav>', () => {
    const tree = Renderer.create(<Sidebar />)
    // throws if can't find 'nav'
    tree.root.findByType('nav')
  })
})
