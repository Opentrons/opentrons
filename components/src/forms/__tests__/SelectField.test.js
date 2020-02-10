// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { SelectField } from '../SelectField'
import { Select } from '../Select'

describe('SelectField', () => {
  test('renders a Select', () => {
    const wrapper = shallow(
      <SelectField name="field" options={[]} value={null} />
    )

    expect(wrapper.find(Select)).toHaveLength(1)
  })

  test('renders caption', () => {
    const wrapper = shallow(
      <SelectField
        name="field"
        options={[]}
        value={null}
        caption={<span data-hook="caption">hello there</span>}
      />
    )

    expect(wrapper.find('[data-hook="caption"]')).toHaveLength(1)
  })

  test('passes props to Select', () => {
    const id = 'id'
    const name = 'name'
    const options = [{ value: 'foo' }, { value: 'bar' }]
    const value = 'bar'
    const disabled = false
    const placeholder = 'hello there'
    const menuPosition = 'absolute'
    const formatOptionLabel = opt => opt.label || opt.value
    const className = 'class'

    const wrapper = shallow(
      <SelectField
        id={id}
        name={name}
        options={options}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        menuPosition={menuPosition}
        formatOptionLabel={formatOptionLabel}
        className={className}
      />
    )

    expect(wrapper.find(Select).props()).toMatchObject({
      id,
      name,
      options,
      placeholder,
      menuPosition,
      formatOptionLabel,
      isDisabled: disabled,
      className: expect.stringContaining(className),
      value: options[1],
    })
  })

  test('passes disabled to isDisabled when disabled=true', () => {
    const name = 'name'
    const options = [{ value: 'foo' }, { value: 'bar' }]
    const value = 'bar'
    const disabled = true

    const wrapper = shallow(
      <SelectField
        name={name}
        options={options}
        value={value}
        disabled={disabled}
      />
    )

    expect(wrapper.find(Select).props()).toMatchObject({
      isDisabled: disabled,
    })
  })

  test('handles onChange and onBlur from Select', () => {
    const handleValueChange = jest.fn()
    const handleLoseFocus = jest.fn()
    const options = [{ value: 'foo' }, { value: 'bar' }]
    const selectWrapper = shallow(
      <SelectField
        name="field"
        options={options}
        value={null}
        onValueChange={handleValueChange}
        onLoseFocus={handleLoseFocus}
      />
    ).find(Select)

    selectWrapper.invoke('onChange')(options[1])
    expect(handleValueChange).toHaveBeenCalledWith('field', 'bar')
    selectWrapper.invoke('onBlur')()
    expect(handleLoseFocus).toHaveBeenCalledWith('field')
  })
})
