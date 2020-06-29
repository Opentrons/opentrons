// @flow
import { AlertModal } from '@opentrons/components'
import { mount } from 'enzyme'
import * as React from 'react'
import { act } from 'react-dom/test-utils'

import { Introduction } from '../Introduction'

describe('Introduction', () => {
  let render

  const mockProceed = jest.fn()
  const mockExit = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('PrimaryButton[children="Continue"]').find('button')

  const getClearDeckContinueButton = wrapper =>
    wrapper
      .find(AlertModal)
      .find('OutlineButton[children="Continue"]')
      .find('button')

  const getClearDeckCancelButton = wrapper =>
    wrapper
      .find(AlertModal)
      .find('OutlineButton[children="Cancel"]')
      .find('button')

  const tiprackLoadnames = [
    'opentrons_96_tiprack_20ul',
    'opentrons_96_tiprack_300ul',
  ]

  beforeEach(() => {
    render = (labwareLoadNames = tiprackLoadnames) => {
      return mount(
        <Introduction
          labwareLoadNames={labwareLoadNames}
          proceed={mockProceed}
          exit={mockExit}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Clear deck warning is not visible on mount', () => {
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(true)
    expect(wrapper.exists('AlertModal[heading="Clear the deck"]')).toBe(false)
  })

  it('clicking continue opens clear deck warning', () => {
    const wrapper = render()

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(wrapper.exists('AlertModal[heading="Clear the deck"]')).toBe(true)
  })

  it('clicking continue in clear deck warning proceeds to next step and cancel exits', () => {
    const wrapper = render()
    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    act(() => getClearDeckContinueButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockProceed).toHaveBeenCalled()

    act(() => getClearDeckCancelButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockExit).toHaveBeenCalled()
  })
})
