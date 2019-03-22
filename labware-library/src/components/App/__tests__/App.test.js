// @flow
// app tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import {App} from '..'

describe('App', () => {
  test('component renders', () => {
    const tree = Renderer.create(<App />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
