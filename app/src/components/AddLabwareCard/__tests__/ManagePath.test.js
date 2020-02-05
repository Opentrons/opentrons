// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import { ConfirmResetPathModal } from '../ConfirmResetPathModal'
import {
  ManagePath,
  OPEN_SOURCE_NAME,
  CHANGE_SOURCE_NAME,
  RESET_SOURCE_NAME,
} from '../ManagePath'

describe('ManagePath', () => {
  const mockPath = '/path/to/a/place'
  const mockOnChangePath = jest.fn()
  const mockOnOpenPath = jest.fn()
  const mockOnResetPath = jest.fn()
  let wrapper

  beforeEach(() => {
    wrapper = mount(
      <ManagePath
        path={mockPath}
        onOpenPath={mockOnOpenPath}
        onResetPath={mockOnResetPath}
        onChangePath={mockOnChangePath}
      />
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('component displays path', () => {
    expect(wrapper.html()).toContain(mockPath)
  })

  test('has a OutlineButton that calls onOpenPath on click', () => {
    expect(mockOnOpenPath).toHaveBeenCalledTimes(0)
    wrapper
      .find(`OutlineButton[name="${OPEN_SOURCE_NAME}"]`)
      .invoke('onClick')()
    expect(mockOnOpenPath).toHaveBeenCalledTimes(1)
  })

  test('has an IconCta that calls onChangePath on click', () => {
    expect(mockOnChangePath).toHaveBeenCalledTimes(0)
    wrapper.find(`IconCta[name="${CHANGE_SOURCE_NAME}"]`).invoke('onClick')()
    expect(mockOnChangePath).toHaveBeenCalledTimes(1)
  })

  describe('reset source', () => {
    beforeEach(() => {
      expect(wrapper.exists(ConfirmResetPathModal)).toBe(false)

      act(() => {
        wrapper.find(`IconCta[name="${RESET_SOURCE_NAME}"]`).invoke('onClick')()
      })

      wrapper.update()
    })

    test('has an IconCta that opens a ConfirmResetPathModal', () => {
      expect(wrapper.exists(ConfirmResetPathModal)).toBe(true)
    })

    test('ConfirmResetPathModal::onCancel closes modal without resetting path', () => {
      act(() => {
        wrapper.find(ConfirmResetPathModal).invoke('onCancel')()
      })

      wrapper.update()
      expect(mockOnResetPath).toHaveBeenCalledTimes(0)
      expect(wrapper.exists(ConfirmResetPathModal)).toBe(false)
    })

    test('ConfirmResetPathModal::onConfirm calls onResetPath and closes modal', () => {
      expect(mockOnResetPath).toHaveBeenCalledTimes(0)
      act(() => {
        wrapper.find(ConfirmResetPathModal).invoke('onConfirm')()
      })

      wrapper.update()
      expect(mockOnResetPath).toHaveBeenCalledTimes(1)
      expect(wrapper.exists(ConfirmResetPathModal)).toBe(false)
    })
  })
})
