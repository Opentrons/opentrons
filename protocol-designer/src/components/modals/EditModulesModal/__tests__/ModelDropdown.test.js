// @flow

import { DropdownField } from '@opentrons/components'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import { mount } from 'enzyme'
import * as Formik from 'formik'
import React from 'react'
import { Provider } from 'react-redux'

import { MODELS_FOR_MODULE_TYPE } from '../../../../constants'
import { ModelDropdown } from '../ModelDropdown'

jest.mock('formik')

const useField: JestMockFn<[any], $Call<typeof Formik.useField, any>> =
  Formik.useField

describe('Model Dropdown', () => {
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
      tabIndex: 0,
      options: MODELS_FOR_MODULE_TYPE[MAGNETIC_MODULE_TYPE],
    }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const render = props =>
    mount(
      <Provider store={mockStore}>
        <ModelDropdown {...props} />
      </Provider>
    )

  it('should render a DropdownField with the appropriate props', () => {
    mockFieldOnce('mockVal', 'mockError', false)
    const wrapper = render(props)
    const dropdownField = wrapper.find(DropdownField)
    expect(dropdownField.prop('tabIndex')).toBe(0)
    expect(dropdownField.prop('options')).toBe(props.options)
    expect(dropdownField.prop('name')).toBe(props.fieldName)
    expect(dropdownField.prop('value')).toBe('mockVal')
    expect(dropdownField.prop('onChange')).toBe(onChange)
    expect(dropdownField.prop('onBlur')).toBe(onBlur)
  })

  it('show an error if field touched and error present', () => {
    mockFieldOnce('mockVal', 'mockError', true)
    const wrapper = render(props)
    const dropdownField = wrapper.find(DropdownField)
    expect(dropdownField.prop('error')).toBe('mockError')
  })
  it('show NOT show an error if field is not touched', () => {
    mockFieldOnce('mockVal', 'mockError', false)
    const wrapper = render(props)
    const dropdownField = wrapper.find(DropdownField)
    expect(dropdownField.prop('error')).toBe(null)
  })
})
