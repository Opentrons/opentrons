// @flow
import { AlertModal } from '@opentrons/components'
import { mount, shallow } from 'enzyme'
import * as React from 'react'

import { Portal } from '../../portal'
import {
  CANCEL_NAME,
  ConfirmResetPathModal,
  ConfirmResetPathModalTemplate,
  RESET_SOURCE_NAME,
} from '../ConfirmResetPathModal'

describe('ConfirmResetPathModal', () => {
  const mockOnCancel = jest.fn()
  const mockOnConfirm = jest.fn()
  const props = {
    onCancel: mockOnCancel,
    onConfirm: mockOnConfirm,
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders inside a Portal', () => {
    const wrapper = shallow(<ConfirmResetPathModal {...props} />)
    const portal = wrapper.find(Portal)
    const modal = portal.find(ConfirmResetPathModalTemplate)

    expect(modal.props()).toEqual(props)
  })

  it('renders an AlertModal', () => {
    const wrapper = shallow(<ConfirmResetPathModalTemplate {...props} />)

    expect(wrapper.exists(AlertModal)).toBe(true)
  })

  it('renders a cancel button that calls props.onCancel', () => {
    const wrapper = mount(<ConfirmResetPathModalTemplate {...props} />)
    const button = wrapper.find(`button[name="${CANCEL_NAME}"]`)

    button.invoke('onClick')()
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('renders a confirm button that calls props.onConfirm', () => {
    const wrapper = mount(<ConfirmResetPathModalTemplate {...props} />)
    const button = wrapper.find(`button[name="${RESET_SOURCE_NAME}"]`)

    button.invoke('onClick')()
    expect(mockOnConfirm).toHaveBeenCalled()
  })
})
