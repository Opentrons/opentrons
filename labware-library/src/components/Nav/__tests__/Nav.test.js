// @flow
// tests for top navbar
import { shallow } from 'enzyme'
import * as React from 'react'

import { Nav } from '..'

describe('Nav', () => {
  it('component renders', () => {
    const tree = shallow(<Nav />)

    expect(tree).toMatchSnapshot()
  })
})
