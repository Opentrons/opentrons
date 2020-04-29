// @flow

import React from 'react'
import * as Formik from 'formik'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { DropdownField } from '@opentrons/components'
import { SlotDropdown } from '../SlotDropdown'

jest.mock('formik')

const useField: JestMockFn<[any], $Call<typeof Formik.useField, any>> =
  Formik.useField

describe('Slot Dropdown', () => {
  let mockStore
  let props

  const onChange = jest.fn()
  const onBlur = jest.fn()
  const setValue = jest.fn()
  const setTouched = jest.fn()

  const mockFieldOnce = (value, error, touched) => {
    const fieldProps: any = { value, onChange, onBlur }
    const fieldMeta: any = { error, touched }
    const fieldHelpers: any = { setValue, setTouched }
    useField.mockReturnValueOnce([fieldProps, fieldMeta, fieldHelpers])
  }

  beforeEach(() => {
    props = {
      fieldName: 'selectedModule',
      tabIndex: 1,
      options: [
        {
          name: 'name',
          value: 'value',
          disabled: false,
        },
      ],
      disabled: false,
    }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
  })
  const render = props =>
    mount(
      <Provider store={mockStore}>
        <SlotDropdown {...props} />
      </Provider>
    )

  it('should render a DropdownField with the appropriate props', () => {
    mockFieldOnce('mockVal', 'mockError', false)
    const wrapper = render(props)
    const dropdownField = wrapper.find(DropdownField)
    expect(dropdownField.prop('tabIndex')).toBe(1)
    expect(dropdownField.prop('options')).toBe(props.options)
    expect(dropdownField.prop('name')).toBe(props.fieldName)
    expect(dropdownField.prop('value')).toBe('mockVal')
    expect(dropdownField.prop('onChange')).toBe(onChange)
    expect(dropdownField.prop('onBlur')).toBe(onBlur)
    expect(dropdownField.prop('error')).toBe('mockError')
  })
})
