// @flow
import { mount } from 'enzyme'
import * as React from 'react'

import { RunTimer } from '../RunTimer'

describe('RunTimer component', () => {
  const startTime = '10:10 AM'
  const runTime = '42:00:00'

  const render = (renderstartTime = startTime) => {
    return mount(<RunTimer startTime={renderstartTime} runTime={runTime} />)
  }

  it('displays the start time', () => {
    const wrapper = render()

    expect(wrapper.html()).toContain(`Start Time: ${startTime}`)
  })

  it('displays the run time', () => {
    const wrapper = render()

    expect(wrapper.html()).toContain(runTime)
  })
})
