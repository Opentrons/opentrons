// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { ControlSection } from '../ControlSection'

describe('ControlSection component', () => {
  it('should display a title', () => {
    const wrapper = mount(<ControlSection title="foobar" />)
    expect(wrapper.find('p').html()).toContain('foobar')
  })

  it('should render children', () => {
    const Child = () => <></>
    const wrapper = mount(
      <ControlSection title="foobar">
        <Child />
      </ControlSection>
    )
    expect(wrapper.find(Child)).toHaveLength(1)
  })
})
