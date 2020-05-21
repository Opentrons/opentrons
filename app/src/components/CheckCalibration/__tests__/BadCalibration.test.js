// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { BadCalibration } from '../BadCalibration'

describe('Introduction', () => {
  const mockExit = jest.fn()

  const getExitButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="Drop tip and exit calibration check"]')
      .find('button')

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking button exits calibration check', () => {
    const wrapper = mount(<BadCalibration exit={mockExit} />)
    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockExit).toHaveBeenCalled()
  })
})
