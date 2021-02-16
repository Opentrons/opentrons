// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { OutlineButton } from '@opentrons/components'
import { RunControls } from '../RunControls'
import { ConfirmCancelModal } from '../../RunLog'

import type { RunControlsProps } from '../RunControls'

describe('run controls component', () => {
  const onRunClick = jest.fn()
  const onPauseClick = jest.fn()
  const onResumeClick = jest.fn()
  const onResetClick = jest.fn()

  const render = (props: $Shape<RunControlsProps> = {}) => {
    const {
      disabled = false,
      modulesReady = false,
      isReadyToRun = false,
      isPaused = false,
      isRunning = false,
      isBlocked = false,
    } = props

    return shallow(
      <RunControls
        {...{
          disabled,
          modulesReady,
          isReadyToRun,
          isPaused,
          isRunning,
          isBlocked,
          onRunClick,
          onPauseClick,
          onResumeClick,
          onResetClick,
        }}
      />
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should not render a ConfirmCancelModal by default', () => {
    const subject = render()
    expect(subject.exists(ConfirmCancelModal)).toBe(false)
  })

  // TODO(mc, 2021-02-16): implement test once run controls tooltips use
  // useHoverTooltip rather than legacy HoverTooltip HoC
  it.todo('should render a pause button if the protocol is running')

  it('should render a cancel button if the protocol is running', () => {
    const subject = render({ isRunning: true })
    const button = subject
      .find(OutlineButton)
      .filterWhere(btn => btn.html().includes('Cancel'))

    button.invoke('onClick')()
    expect(onPauseClick).toHaveBeenCalledTimes(1)
  })

  it('should render a ConfirmCancelModal when cancel button clicked', () => {
    const subject = render({ isRunning: true })

    subject
      .find(OutlineButton)
      .filterWhere(btn => btn.html().includes('Cancel'))
      .invoke('onClick')()

    const modal = subject.find(ConfirmCancelModal)

    expect(modal.exists()).toBe(true)
    modal.invoke('onClose')()
    expect(subject.exists(ConfirmCancelModal)).toBe(false)
  })

  it('should disable run controls when cancel modal open', () => {
    const subject = render({ isRunning: true })

    subject
      .find(OutlineButton)
      .filterWhere(btn => btn.html().includes('Cancel'))
      .invoke('onClick')()

    const allButtons = subject.find(OutlineButton)

    allButtons.forEach(btn => {
      expect(btn.prop('disabled')).toBe(true)
    })
  })
})
