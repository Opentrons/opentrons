// @flow
// tests for Logo image component
import * as React from 'react'
import Renderer from 'react-test-renderer'

import Logo from '../Logo'

describe('Logo', () => {
  test('component renders', () => {
    const tree = Renderer.create(<Logo />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders an <img>', () => {
    const tree = Renderer.create(<Logo />)
    // throws if can't find 'img'
    tree.root.findByType('img')
  })
})
