// @flow
// app tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import Page from '../Page'

// unable to test render React.lazy; not sure why
jest.mock('../../../definitions')

// mock out Sideebar because it depends on react-router
jest.mock('../../Sidebar', () => props => `Sidebar(${JSON.stringify(props)})`)

describe('Page', () => {
  test('component renders', () => {
    const tree = Renderer.create(
      <Page location={({search: ''}: any)} />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
