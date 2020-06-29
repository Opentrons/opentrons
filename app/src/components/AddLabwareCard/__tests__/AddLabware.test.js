// @flow
import { mount } from 'enzyme'
import * as React from 'react'

import { ADD_LABWARE_NAME, AddLabware } from '../AddLabware'

describe('AddLabware', () => {
  const mockOnAddLabware = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('has a button that calls onAddLabware on click', () => {
    const wrapper = mount(<AddLabware onAddLabware={mockOnAddLabware} />)

    expect(mockOnAddLabware).toHaveBeenCalledTimes(0)
    wrapper.find(`button[name="${ADD_LABWARE_NAME}"]`).invoke('onClick')()
    expect(mockOnAddLabware).toHaveBeenCalledTimes(1)
  })
})
