// @flow
import React from 'react'
import { render, shallow, mount } from 'enzyme'
import { ModuleStepItems } from '../ModuleStepItems'

let props
beforeEach(() => {
  props = {
    action: 'action',
    module: 'magdeck',
    actionText: 'engage',
    labwareDisplayName: 'magnet module',
    labwareNickname: 'maggie',
    message: 'my magnet module',
  }
})

test('message is displayed when message exists', () => {
  const wrapper = shallow(<ModuleStepItems {...props} />)

  expect(wrapper.find('PDListItem')).toHaveLength(2)
  // TODO 2020-2-4 JF maybe use data attributes when implemented
  expect(
    wrapper
      .find('.step-item-message')
      .render()
      .text()
  ).toContain(props.message)
})

test('message is not displayed when no message', () => {
  props.message = ''

  const wrapper = shallow(<ModuleStepItems {...props} />)

  expect(wrapper.find('PDListItem')).toHaveLength(1)
  expect(wrapper.find('.step-item-message').exists).toBeTruthy()
})

test('module name, action, and actionText is displayed', () => {
  const wrapper = render(<ModuleStepItems {...props} />)

  const text = wrapper.text()
  expect(text).toContain(props.action)
  expect(text).toContain(props.actionText)
  expect(text).toContain('Magnetic module')
})

test('labware nickname and display name is displayed in the tooltip', () => {
  const wrapper = mount(<ModuleStepItems {...props} />)

  expect(wrapper.text()).toContain(props.labwareNickname)
})
