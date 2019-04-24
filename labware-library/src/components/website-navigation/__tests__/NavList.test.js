// @flow
// tests for main navbar link list
import * as React from 'react'
import { shallow } from 'enzyme'

import { NavList } from '..'

describe('NavList', () => {
  test('component renders', () => {
    const tree = shallow(<NavList />)

    expect(tree).toMatchSnapshot()
  })

  test('component handles state changes', () => {
    const tree = shallow(<NavList />)

    expect(tree.state().menu).toEqual(null)
    tree.setState({ menu: 'foo' })
    expect(tree.state().menu).toEqual('foo')
  })

  test('component applies active class based on state', () => {
    const tree = shallow(<NavList />)

    tree.setState({ menu: 'foo' })
    expect(tree.someWhere(n => n.hasClass('active')))
  })
})
