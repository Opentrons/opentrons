// tests for main navbar
import { MainNav } from '..'
import { shallow } from 'enzyme'
import * as React from 'react'

describe('MainNav', () => {
  it('component renders', () => {
    const tree = shallow(<MainNav />)

    expect(tree).toMatchSnapshot()
  })
})
