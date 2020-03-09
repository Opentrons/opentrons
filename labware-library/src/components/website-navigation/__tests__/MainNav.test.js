// @flow
// tests for main navbar
import * as React from 'react'
import { shallow } from 'enzyme'

import { MainNav } from '..'

describe('MainNav', () => {
  it('component renders', () => {
    const tree = shallow(<MainNav />)

    expect(tree).toMatchSnapshot()
  })
})
