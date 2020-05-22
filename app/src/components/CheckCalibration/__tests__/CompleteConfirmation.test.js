// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { CompleteConfirmation } from '../CompleteConfirmation'

describe('CompleteConfirmation', () => {
  let render

  const mockExit = jest.fn()

  const getExitButton = wrapper =>
    wrapper.find('PrimaryButton[children="Drop tip and exit"]').find('button')

  beforeEach(() => {
    render = ({
      stepsPassed = 1,
      stepsFailed = 1,
    }: {
      stepsPassed?: number,
      stepsFailed?: number,
    }) => {
      return mount(
        <CompleteConfirmation
          stepsPassed={stepsPassed}
          stepsFailed={stepsFailed}
          exit={mockExit}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // NOTE: '\u00a0' is the unix character that enzyme translates $nbsp; to
  it('correctly pluralizes passed', () => {
    const wrapper = render({ stepsPassed: 2, stepsFailed: 1 })

    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('2\u00a0checks\u00a0passed')
    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('1\u00a0check\u00a0failed')
  })

  it('correctly pluralizes failed', () => {
    const wrapper = render({ stepsPassed: 1, stepsFailed: 2 })
    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('1\u00a0check\u00a0passed')
    expect(
      wrapper
        .find('p')
        .at(1)
        .text()
    ).toEqual('2\u00a0checks\u00a0failed')
  })

  it('does not render failed if none failed', () => {
    const wrapper = render({ stepsPassed: 1, stepsFailed: 0 })
    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('1\u00a0check\u00a0passed')
    expect(wrapper.find('p').length).toEqual(1)
  })

  it('does not render passed if none passed', () => {
    const wrapper = render({ stepsPassed: 0, stepsFailed: 1 })

    expect(
      wrapper
        .find('p')
        .at(0)
        .text()
    ).toEqual('1\u00a0check\u00a0failed')
    expect(wrapper.find('p').length).toEqual(1)
  })

  it('clicking exit button exits', () => {
    const wrapper = render({})

    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockExit).toHaveBeenCalled()
  })
})
