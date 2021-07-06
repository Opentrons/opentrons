import React from 'react'
import * as Formik from 'formik'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { DropdownField } from '@opentrons/components'
import { SlotDropdown, SlotDropdownProps } from '../SlotDropdown'

jest.mock('formik')

const useField = Formik.useField as jest.MockedFunction<typeof Formik.useField>

describe('Slot Dropdown', () => {
  let mockStore: any
  let props: SlotDropdownProps

  const onChange = jest.fn()
  const onBlur = jest.fn()
  const setValue = jest.fn()
  const setTouched = jest.fn()

  const mockFieldOnce = (
    value: string | null | undefined,
    error: string | null | undefined,
    touched: boolean
  ) => {
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

  afterEach(() => {
    jest.resetAllMocks()
  })

  const render = (props: SlotDropdownProps) =>
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
