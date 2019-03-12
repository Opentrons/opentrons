// app tests
import React from 'react'
import Renderer from 'react-test-renderer'

import {App} from '..'

describe('App', () => {
  test('component renders', () => {
    const tree = Renderer.create(<App />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
