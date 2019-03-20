// @flow
// app tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import {App} from '..'

// unable to test render React.lazy; not sure why
jest.mock('../../LabwareList', () => () => 'LabwareList')

describe('App', () => {
  test('component renders', async () => {
    const tree = Renderer.create(<App />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
