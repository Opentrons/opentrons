// @flow

import * as React from 'react'
import { shallow, mount } from 'enzyme'

import { ChangePathButton } from '../ChangePathButton'

describe('AddLabwareCard', () => {
  const mockOnChangePath = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('clicking the button calls onChangePath', () => {
    const wrapper = mount(<ChangePathButton onChangePath={mockOnChangePath} />)

    expect(mockOnChangePath).toHaveBeenCalledTimes(0)
    wrapper.find('button').invoke('onClick')()
    expect(mockOnChangePath).toHaveBeenCalledTimes(1)
  })

  test('component renders', () => {
    const wrapper = shallow(
      <ChangePathButton onChangePath={mockOnChangePath} />
    )

    expect(wrapper).toMatchSnapshot()
  })
})
