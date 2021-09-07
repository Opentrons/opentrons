import * as React from 'react'
import { mount, ReactWrapper } from 'enzyme'

import { ConfirmCrashRecoveryModal } from '../ConfirmCrashRecoveryModal'

describe('ConfirmCrashRecoveryModal', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof ConfirmCrashRecoveryModal>>
  ) => ReactWrapper<React.ComponentProps<typeof ConfirmCrashRecoveryModal>>
  const mockBack = jest.fn()
  const mockConfirm = jest.fn()

  const getExitButton = (
    wrapper: ReactWrapper<
      React.ComponentProps<typeof ConfirmCrashRecoveryModal>
    >
  ) => wrapper.find('OutlineButton[children="cancel"]')
  const getNoTipRestartButton = (
    wrapper: ReactWrapper<
      React.ComponentProps<typeof ConfirmCrashRecoveryModal>
    >
  ) => wrapper.find('OutlineButton[children="yes, start over"]')
  const getReplaceTipRestartButton = (
    wrapper: ReactWrapper<
      React.ComponentProps<typeof ConfirmCrashRecoveryModal>
    >
  ) => wrapper.find('OutlineButton[children="tip placed in a1, start over"]')

  beforeEach(() => {
    render = (props = {}) => {
      const {
        back = mockBack,
        confirm = mockConfirm,
        tipRackDisplayName = 'tipRackName',
        tipRackSlot = '8',
        requiresNewTip = true,
      } = props
      return mount(
        <ConfirmCrashRecoveryModal
          back={back}
          confirm={confirm}
          tipRackDisplayName={tipRackDisplayName}
          tipRackSlot={tipRackSlot}
          requiresNewTip={requiresNewTip}
        />
      )
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking cancel cancels', () => {
    const wrapper = render()
    expect(getExitButton(wrapper).exists()).toBe(true)
    getExitButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    expect(mockBack).toHaveBeenCalled()
  })

  it('has a working button with the right text when no tip placement needed', () => {
    const wrapper = render({ requiresNewTip: false })

    expect(getNoTipRestartButton(wrapper).exists()).toBe(true)
    getNoTipRestartButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(mockConfirm).toHaveBeenCalled()
  })

  it('has a working button with the right text when tip placement needed', () => {
    const wrapper = render({ requiresNewTip: true })
    expect(getReplaceTipRestartButton(wrapper).exists()).toBe(true)
    getReplaceTipRestartButton(wrapper).invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()

    expect(mockConfirm).toHaveBeenCalled()
  })

  it('renders no request to replace tip when not needed', () => {
    const wrapper = render({ requiresNewTip: false })
    expect(wrapper.html()).toMatch(
      /starting over will cancel your calibration progress/i
    )
    expect(wrapper.html()).not.toMatch(
      /please put an undamaged tip in position a1/i
    )
  })

  it('renders a request to replace tip with specified name if needed', () => {
    const wrapper = render({
      requiresNewTip: true,
      tipRackSlot: '4',
      tipRackDisplayName: 'my tip rack',
    })
    expect(wrapper.html()).toMatch(
      /starting over will cancel your calibration progress/i
    )
    expect(wrapper.html()).toMatch(
      /please put an undamaged tip in position a1/i
    )
    expect(wrapper.html()).toMatch(/my tip rack/i)
    expect(wrapper.html()).toMatch(/slot 4/i)
  })
})
