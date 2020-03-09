// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import * as Fixtures from '../../../../../networking/__fixtures__'
import { SelectField } from '@opentrons/components'
import { UploadKeyInput } from '../UploadKeyInput'
import { SelectKey, ADD_NEW_KEY_VALUE } from '../SelectKey'

import { LABEL_ADD_NEW_KEY } from '../constants'

describe('ConnectModal SelectKey', () => {
  const fieldId = 'field-id'
  const fieldName = 'field-name'
  const fieldLabel = 'Field Label:'
  const fieldPlaceholder = 'Placeholder...'
  const fieldError = 'oh no!'
  const robotName = 'robot-name'
  const wifiKeys = [
    { ...Fixtures.mockWifiKey, id: 'foo', name: 'foo.crt' },
    { ...Fixtures.mockWifiKey, id: 'bar', name: 'bar.crt' },
    { ...Fixtures.mockWifiKey, id: 'baz', name: 'baz.crt' },
  ]
  const handleValueChange = jest.fn()
  const handleLoseFocus = jest.fn()

  const render = (value = null) => {
    return shallow(
      <SelectKey
        id={fieldId}
        name={fieldName}
        label={fieldLabel}
        placeholder={fieldPlaceholder}
        error={fieldError}
        value={value}
        onValueChange={handleValueChange}
        onLoseFocus={handleLoseFocus}
        wifiKeys={wifiKeys}
        robotName={robotName}
      />
    )
  }

  it('renders a SelectField', () => {
    const wrapper = render('bar')
    const select = wrapper.find(SelectField)
    expect(select).toHaveLength(1)
    expect(select.prop('id')).toEqual(fieldId)
    expect(select.prop('name')).toEqual(fieldName)
    expect(select.prop('error')).toEqual(fieldError)
    expect(select.prop('placeholder')).toEqual(fieldPlaceholder)
    expect(select.prop('onLoseFocus')).toEqual(handleLoseFocus)
    expect(select.prop('value')).toEqual('bar')
  })

  it('renders a label for the field', () => {
    const wrapper = render()
    const label = wrapper
      .find(`[label="${fieldLabel}"]`)
      .dive()
      .find(`label[htmlFor="${fieldId}"]`)

    expect(label.text()).toEqual(fieldLabel)
  })

  it('renders wifiKeys as options', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)

    expect(select.prop('options')).toEqual(
      expect.arrayContaining([
        {
          options: [
            { value: 'foo', label: 'foo.crt' },
            { value: 'bar', label: 'bar.crt' },
            { value: 'baz', label: 'baz.crt' },
          ],
        },
      ])
    )
  })

  it('renders an UploadKeyInput and an option to trigger it', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)
    const upload = wrapper.find(UploadKeyInput)
    const expected = { value: ADD_NEW_KEY_VALUE, label: LABEL_ADD_NEW_KEY }

    expect(upload.prop('label')).toEqual(LABEL_ADD_NEW_KEY)
    expect(upload.prop('robotName')).toEqual(robotName)
    expect(select.prop('options')).toEqual(
      expect.arrayContaining([
        {
          options: [expected],
        },
      ])
    )
  })

  it('updates the field value with UploadKeyInput::onUpload', () => {
    const wrapper = render()
    const upload = wrapper.find(UploadKeyInput)

    upload.invoke('onUpload')('new-key-id')
    expect(handleValueChange).toHaveBeenCalledWith(fieldName, 'new-key-id')
  })

  it('updates the field value with SelectField::onValueChange', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)

    select.invoke('onValueChange')('new-key-id')
    expect(handleValueChange).toHaveBeenCalledWith(fieldName, 'new-key-id')
  })

  it('does not update the field value when add new option is selected', () => {
    const wrapper = render()
    const select = wrapper.find(SelectField)

    select.invoke('onValueChange')(ADD_NEW_KEY_VALUE)
    expect(handleValueChange).not.toHaveBeenCalledWith(
      fieldName,
      ADD_NEW_KEY_VALUE
    )
  })
})
