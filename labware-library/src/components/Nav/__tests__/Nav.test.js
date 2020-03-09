// @flow
// tests for top navbar
import * as React from 'react'
import { shallow } from 'enzyme'

import { Nav } from '..'

describe('Nav', () => {
  it('component renders', () => {
    const tree = shallow(<Nav />)

    expect(tree).toMatchSnapshot()
  })
})
