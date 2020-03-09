// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import * as Fixtures from '../../../../../networking/__fixtures__'
import { SelectField } from '@opentrons/components'
import { SelectSecurity } from '../SelectSecurity'

import {
  CONFIGURE_FIELD_SECURITY_TYPE,
  LABEL_SECURITY_NONE,
  LABEL_SECURITY_PSK,
  SECURITY_NONE,
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
} from '../constants'

describe('ConnectModal SelectSecurity', () => {
  const fieldId = 'field-id'
  const fieldName = 'field-name'
  const fieldLabel = 'Field Label:'
  const fieldPlaceholder = 'Placeholder...'
  const fieldError = 'oh no!'
  const eapOptions = [
    { ...Fixtures.mockEapOption, name: 'option1', displayName: 'Option 1' },
    { ...Fixtures.mockEapOption, name: 'option2', displayName: 'Option 2' },
    { ...Fixtures.mockEapOption, name: 'option3', displayName: 'Option 3' },
  ]
  const handleSecurityChange = jest.fn()
  const handleLoseFocus = jest.fn()

  const render = (showAll = false, values = {}) =>
    mount(
      <SelectSecurity
        id={fieldId}
        name={fieldName}
        label={fieldLabel}
        placeholder={fieldPlaceholder}
        error={fieldError}
        showAll={showAll}
        eapOptions={eapOptions}
        values={values}
        onSecurityChange={handleSecurityChange}
        onLoseFocus={handleLoseFocus}
      />
    )

  it('renders a SelectField', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)
    expect(select).toHaveLength(1)
    expect(select.prop('id')).toEqual(fieldId)
    expect(select.prop('name')).toEqual(fieldName)
    expect(select.prop('error')).toEqual(fieldError)
    expect(select.prop('placeholder')).toEqual(fieldPlaceholder)
    expect(select.prop('onLoseFocus')).toEqual(handleLoseFocus)
    expect(select.prop('value')).toEqual(null)
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
    const wrapper = render(true)
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

  it('triggers an update for securityType if selected', () => {
    const wrapper = render(true)
    const select = wrapper.find(SelectField)

    select.invoke('onValueChange')(CONFIGURE_FIELD_SECURITY_TYPE, SECURITY_NONE)
    expect(handleSecurityChange).toHaveBeenCalledWith({
      [CONFIGURE_FIELD_SECURITY_TYPE]: SECURITY_NONE,
    })

    select.invoke('onValueChange')(
      CONFIGURE_FIELD_SECURITY_TYPE,
      SECURITY_WPA_PSK
    )
    expect(handleSecurityChange).toHaveBeenCalledWith({
      [CONFIGURE_FIELD_SECURITY_TYPE]: SECURITY_WPA_PSK,
    })
  })

  it('can set value according to values.securityType', () => {
    const wrapper = render(true, { securityType: SECURITY_NONE })
    const select = wrapper.find(SelectField)

    expect(select.prop('value')).toEqual(SECURITY_NONE)
  })

  it('can set value according to values.eapConfig.eapType', () => {
    const wrapper = render(true, {
      securityType: SECURITY_WPA_EAP,
      eapConfig: { eapType: 'option1' },
    })
    const select = wrapper.find(SelectField)

    expect(select.prop('value')).toEqual('option1')
  })
})
