// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'
import { AlertModal } from '@opentrons/components'

import { actions as robotActions } from '../../../redux/robot'
import { Portal } from '../../portal'
import { ConfirmCancelModal } from '../ConfirmCancelModal'

describe('ConfirmCancelModal', () => {
  const onClose = jest.fn()

  const render = () => {
    return mountWithStore(<ConfirmCancelModal onClose={onClose} />)
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an AlertModal inside a Portal', () => {
    const { wrapper: subject } = render()

    expect(subject.find(Portal).exists(AlertModal)).toBe(true)
  })

  it('should render a cancel button that calls props.onClose and dispatches run cancellation', () => {
    const { wrapper: subject, store } = render()
    const cancelButton = subject
      .find('button')
      .filterWhere(btn => btn.html().includes('cancel'))

    cancelButton.invoke('onClick')()

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(robotActions.cancel())
  })

  it('should render a back button that calls props.onClose', () => {
    const { wrapper: subject } = render()
    const backButton = subject
      .find('button')
      .filterWhere(btn => btn.html().includes('back'))

    backButton.invoke('onClick')()

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
