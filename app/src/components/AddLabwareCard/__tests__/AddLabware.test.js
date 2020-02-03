// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { AddLabware } from '../AddLabware'

describe('AddLabware', () => {
  const mockOnAddLabware = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('has a button that calls onAddLabware on click', () => {
    const wrapper = mount(<AddLabware onAddLabware={mockOnAddLabware} />)

    expect(mockOnAddLabware).toHaveBeenCalledTimes(0)
    wrapper.find('button[name="add-labware"]').invoke('onClick')()
    expect(mockOnAddLabware).toHaveBeenCalledTimes(1)
  })
})
