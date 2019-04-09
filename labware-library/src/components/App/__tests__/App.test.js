// @flow
// app tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { App } from '..'

jest.mock('../../../definitions')

describe('App', () => {
  test('component renders', () => {
    const tree = shallow(
      <App
        location={({ search: '' }: any)}
        history={({}: any)}
        match={({}: any)}
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
