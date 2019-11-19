// @flow
import * as React from 'react'
import { shallow, mount } from 'enzyme'

import { ManagePath } from '../ManagePath'

describe('AddLabwareCard', () => {
  const mockPath = '/path/to/a/place'
  const mockOnChangePath = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('component displays path', () => {
    const wrapper = mount(
      <ManagePath path={mockPath} onChangePath={mockOnChangePath} />
    )

    expect(wrapper.html()).toContain(mockPath)
  })

  test('has a button that calls onChangePath on click', () => {
    const wrapper = mount(
      <ManagePath path={mockPath} onChangePath={mockOnChangePath} />
    )

    expect(mockOnChangePath).toHaveBeenCalledTimes(0)
    wrapper.find('button').invoke('onClick')()
    expect(mockOnChangePath).toHaveBeenCalledTimes(1)
  })

  test('component renders', () => {
    const wrapper = shallow(
      <ManagePath path={mockPath} onChangePath={mockOnChangePath} />
    )

    expect(wrapper).toMatchSnapshot()
  })
})
