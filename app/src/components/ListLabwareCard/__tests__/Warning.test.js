// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { Warning } from '../Warning'

describe('Warning', () => {
  test('component renders', () => {
    const wrapper = shallow(<Warning>AH!!!</Warning>)

    expect(wrapper).toMatchSnapshot()
  })
})
