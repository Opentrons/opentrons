// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { PathDetail } from '../PathDetail'

describe('AddLabwareCard', () => {
  const mockPath = '/path/to/a/place'

  test('component displays path', () => {
    const wrapper = shallow(<PathDetail path={mockPath} />)

    expect(wrapper.html()).toContain(mockPath)
  })

  test('component renders', () => {
    const wrapper = shallow(<PathDetail path={mockPath} />)

    expect(wrapper).toMatchSnapshot()
  })
})
