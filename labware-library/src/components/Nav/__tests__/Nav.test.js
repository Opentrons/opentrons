// @flow
// tests for top navbar
import * as React from 'react'
import Renderer from 'react-test-renderer'

import Nav from '..'

describe('Nav', () => {
  test('component renders', () => {
    const tree = Renderer.create(<Nav />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
