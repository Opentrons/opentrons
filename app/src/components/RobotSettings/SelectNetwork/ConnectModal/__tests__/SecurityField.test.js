// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import * as Fixtures from '../../../../../networking/__fixtures__'
import { SelectField } from '@opentrons/components'
import { SecurityField } from '../SecurityField'
import * as FormState from '../form-state'

import { LABEL_SECURITY_NONE, LABEL_SECURITY_PSK } from '../../i18n'
import { SECURITY_NONE, SECURITY_WPA_PSK } from '../../constants'

jest.mock('../form-state')

const useConnectFormField: JestMockFn<
  [string],
  $Call<typeof FormState.useConnectFormField, string>
> = FormState.useConnectFormField

describe('ConnectModal SecurityField', () => {
  const fieldId = 'field-id'
  const fieldName = 'field-name'
  const fieldLabel = 'Field Label:'
  const fieldPlaceholder = 'Placeholder...'
  const eapOptions = [
    { ...Fixtures.mockEapOption, name: 'option1', displayName: 'Option 1' },
    { ...Fixtures.mockEapOption, name: 'option2', displayName: 'Option 2' },
    { ...Fixtures.mockEapOption, name: 'option3', displayName: 'Option 3' },
  ]
  const setValue = jest.fn()
  const setTouched = jest.fn()

  const render = (value = null, error = null, showAllOptions = false) => {
    useConnectFormField.mockImplementation(name => {
      expect(name).toBe(fieldName)
      return {
        value,
        error,
        setValue,
        setTouched,
        onChange: () => {},
        onBlur: () => {},
      }
    })

    return mount(
      <SecurityField
        id={fieldId}
        name={fieldName}
        label={fieldLabel}
        placeholder={fieldPlaceholder}
        showAllOptions={showAllOptions}
        eapOptions={eapOptions}
      />
    )
  }

  it('renders a SelectField', () => {
    const wrapper = render('value', 'error')
    const select = wrapper.find(SelectField)

    expect(select.prop('id')).toEqual(fieldId)
    expect(select.prop('name')).toEqual(fieldName)
    expect(select.prop('placeholder')).toEqual(fieldPlaceholder)
    expect(select.prop('value')).toEqual('value')
    expect(select.prop('error')).toEqual('error')
  })

  it('renders a label for the field', () => {
    const wrapper = render()
    const label = wrapper.find(`label[htmlFor="${fieldId}"]`)

    expect(label.text()).toEqual(fieldLabel)
  })

  it('renders EAP security options', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)

    expect(select.prop('options')).toEqual(
      expect.arrayContaining([
        {
          options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ],
        },
      ])
    )
  })

  it('can render all security options', () => {
    const wrapper = render(null, null, true)
    const select = wrapper.find(SelectField)

    expect(select.prop('options')).toEqual(
      expect.arrayContaining([
        {
          options: [{ value: SECURITY_NONE, label: LABEL_SECURITY_NONE }],
        },
        {
          options: [{ value: SECURITY_WPA_PSK, label: LABEL_SECURITY_PSK }],
        },
      ])
    )
  })

  it('triggers a value update if selected', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)

    select.invoke('onValueChange')(fieldName, SECURITY_NONE)
    expect(setValue).toHaveBeenCalledWith(SECURITY_NONE)
  })

  it('triggers a touched update if blurred', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)

    select.invoke('onLoseFocus')(fieldName)
    expect(setTouched).toHaveBeenCalledWith(true)
  })
})
