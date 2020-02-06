// @flow
// tests for Logo image component
import * as React from 'react'
import { shallow } from 'enzyme'

import { Logo } from '../Logo'

describe('Logo', () => {
  test('component renders', () => {
    const tree = shallow(<Logo />)

    expect(tree).toMatchSnapshot()
  })

  test('renders an <img>', () => {
    const tree = shallow(<Logo />)

    expect(tree.find('img')).toHaveLength(1)
  })
})
