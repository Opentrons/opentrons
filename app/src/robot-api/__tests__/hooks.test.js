// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { useTriggerRobotApiAction } from '..'
import type { RobotApiRequestState } from '../types'

describe('useTriggerRobotApiAction', () => {
  const mockTrigger = jest.fn()
  const mockOnFinish = jest.fn()

  const TestUseTrigger = (props: {
    trigger: () => mixed,
    requestState: RobotApiRequestState | null,
    onFinish: () => mixed,
  }) => {
    const { trigger, requestState, onFinish } = props
    const callApi = useTriggerRobotApiAction(trigger, requestState, {
      onFinish,
    })

    return <button onClick={callApi} />
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calling returned function triggers API call', () => {
    const wrapper = mount(
      <TestUseTrigger
        trigger={mockTrigger}
        requestState={null}
        onFinish={mockOnFinish}
      />
    )

    expect(mockTrigger).toHaveBeenCalledTimes(0)
    wrapper.find('button').invoke('onClick')()
    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })

  test('if request state switches to completed, calls onFinish', () => {
    const wrapper = mount(
      <TestUseTrigger
        trigger={mockTrigger}
        requestState={null}
        onFinish={mockOnFinish}
      />
    )

    expect(mockOnFinish).toHaveBeenCalledTimes(0)
    wrapper.find('button').invoke('onClick')()
    // request in progress (response: null)
    wrapper.setProps({ requestState: { response: null } })
    // request complete (response: something)
    wrapper.setProps({ requestState: { response: { body: {} } } })
    expect(mockOnFinish).toHaveBeenCalledTimes(1)
  })

  test('does not call onFinish if request was never triggered', () => {
    const wrapper = mount(
      <TestUseTrigger
        trigger={mockTrigger}
        requestState={null}
        onFinish={mockOnFinish}
      />
    )

    // request in progress (response: null)
    wrapper.setProps({ requestState: { response: null } })
    // request complete (response: something)
    wrapper.setProps({ requestState: { response: { body: {} } } })
    expect(mockOnFinish).toHaveBeenCalledTimes(0)
  })
})
