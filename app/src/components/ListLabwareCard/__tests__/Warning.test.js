// @flow
import { shallow } from 'enzyme'
import * as React from 'react'

import { Warning } from '../Warning'

describe('Warning', () => {
  it('component renders', () => {
    const wrapper = shallow(<Warning>AH!!!</Warning>)

    expect(wrapper).toMatchSnapshot()
  })
})
