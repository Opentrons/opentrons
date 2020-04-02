// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { AlertModal } from '@opentrons/components'

import * as Calibration from '../../../calibration'
import { mockRobotCalibrationCheckSessionData } from '../../../calibration/__fixtures__'

import { Introduction } from '../Introduction'

import type { State } from '../../../types'

jest.mock('../../../calibration/selectors')

describe('Introduction', () => {
  let mockStore
  let render

  const mockExit = jest.fn()
  const mockProceed = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('PrimaryButton[children="Continue"]').find('button')

  const tiprackLoadnames = [
    'opentrons_96_tiprack_20ul',
    'opentrons_96_tiprack_300ul',
  ]

  beforeEach(() => {
    render = (labwareLoadNames = tiprackLoadnames) => {
      return mount(
        <Introduction
          labwareLoadNames={labwareLoadNames}
          exit={mockExit}
          proceed={mockProceed}
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
})
