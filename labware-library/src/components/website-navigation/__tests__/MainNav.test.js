// @flow
// tests for main navbar
import { shallow } from 'enzyme'
import * as React from 'react'

import { MainNav } from '..'

describe('MainNav', () => {
  it('component renders', () => {
    const tree = shallow(<MainNav />)

    expect(tree).toMatchSnapshot()
  })
})
