// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import * as Sessions from '../../../sessions'

import { ConfirmExitModal } from '../ConfirmExitModal'

describe('ConfirmExitModal', () => {
  let render

  const mockBack = jest.fn()
  const mockExit = jest.fn()

  const getExitButton = wrapper =>
    wrapper.find('OutlineButton[children="continue"]')

  const getBackButton = wrapper =>
    wrapper.find('OutlineButton[children="go back"]')

  beforeEach(() => {
    render = (
      props: $Shape<React.ElementProps<typeof ConfirmExitModal>> = {}
    ) => {
      const { sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION } = props
      return mount(
        <ConfirmExitModal
          exit={mockExit}
          back={mockBack}
          sessionType={sessionType}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm exit calls exit', () => {
    const wrapper = render()

    getExitButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockExit).toHaveBeenCalled()
  })

  it('clicking back calls back', () => {
    const wrapper = render()

    getBackButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockBack).toHaveBeenCalled()
  })

  it('deck cal session type shows correct text', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('deck calibration')
  })

  it('pipette offset cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    expect(wrapper.text()).toContain('pipette offset calibration')
  })
})
