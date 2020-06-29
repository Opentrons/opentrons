// @flow
// tests for Logo image component
import { shallow } from 'enzyme'
import * as React from 'react'

import { Logo } from '../Logo'

describe('Logo', () => {
  it('component renders', () => {
    const tree = shallow(<Logo />)

    expect(tree).toMatchSnapshot()
  })

  it('renders an <img>', () => {
    const tree = shallow(<Logo />)

    expect(tree.find('img')).toHaveLength(1)
  })
})
