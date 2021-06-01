import * as React from 'react'
import { mount } from 'enzyme'
import * as Sessions from '../../../redux/sessions'

import { ConfirmExitModal } from '../ConfirmExitModal'

import type { ReactWrapper } from 'enzyme'

describe('ConfirmExitModal', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof ConfirmExitModal>>
  ) => ReactWrapper<React.ComponentProps<typeof ConfirmExitModal>>

  const mockBack = jest.fn()
  const mockExit = jest.fn()

  const getExitButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ConfirmExitModal>>
  ) => wrapper.find('OutlineButton[children="yes, exit now"]')

  const getBackButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ConfirmExitModal>>
  ) => wrapper.find('OutlineButton[children="no, go back"]')

  beforeEach(() => {
    render = (props = {}) => {
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

    getExitButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    expect(mockExit).toHaveBeenCalled()
  })

  it('clicking back calls back', () => {
    const wrapper = render()

    getBackButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
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

  it('tip length cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    })
    expect(wrapper.text()).toContain('tip length calibration')
  })
})
