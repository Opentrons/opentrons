// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { AddLabware, ADD_LABWARE_NAME } from '../AddLabware'

describe('AddLabware', () => {
  const mockOnAddLabware = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('has a button that calls onAddLabware on click', () => {
    const wrapper = mount(<AddLabware onAddLabware={mockOnAddLabware} />)

    expect(mockOnAddLabware).toHaveBeenCalledTimes(0)
    wrapper.find(`button[name="${ADD_LABWARE_NAME}"]`).invoke('onClick')()
    expect(mockOnAddLabware).toHaveBeenCalledTimes(1)
  })
})
