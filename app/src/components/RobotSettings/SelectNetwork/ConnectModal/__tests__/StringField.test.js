// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import { StringField } from '../StringField'

describe('ConnectModal StringField', () => {
  const fieldId = 'field-id'
  const fieldName = 'field-name'
  const fieldValue = 'field-value'
  const handleChange = jest.fn()
  const handleBlur = jest.fn()

  const fieldLabel = 'Field Label:'
  const inputSelector = `input[name="${fieldName}"]`
  const labelSelector = `label[htmlFor="${fieldId}"]`
  const checkboxSelector = 'input[type="checkbox"]'

  const render = (isPassword = false, error = null) => {
    return mount(
      <StringField
        id={fieldId}
        label={fieldLabel}
        name={fieldName}
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        isPassword={isPassword}
      />
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an input and passes field props through', () => {
    const wrapper = render()
    const input = wrapper.find(inputSelector)

    expect(input).toHaveLength(1)
    expect(input.prop('name')).toEqual(fieldName)
    expect(input.prop('value')).toEqual(fieldValue)
    expect(input.prop('onChange')).toEqual(handleChange)
    expect(input.prop('onBlur')).toEqual(handleBlur)
  })

  it('renders an input[type="text"] if props.type is string', () => {
    const wrapper = render()
    const input = wrapper.find(inputSelector)

    expect(input).toHaveLength(1)
    expect(input.prop('id')).toEqual(fieldId)
    expect(input.prop('type')).toEqual('text')
  })

  it('renders an input[type="password"] if props.type is password', () => {
    const wrapper = render(true)
    const input = wrapper.find(inputSelector)

    expect(input.prop('type')).toEqual('password')
  })

  it('renders a checkbox to toggle showing password if type password', () => {
    const wrapper = render(true)
    const checkbox = wrapper.find(checkboxSelector)

    expect(checkbox).toHaveLength(1)
    expect(checkbox.prop('checked')).toEqual(false)
  })

  it('toggling the checkbox switches password input to text', () => {
    const wrapper = render(true)
    const checkbox = wrapper.find(checkboxSelector)

    act(() => checkbox.invoke('onChange')())
    wrapper.update()
    expect(wrapper.find(checkboxSelector).prop('checked')).toEqual(true)
    expect(wrapper.find(inputSelector).prop('type')).toEqual('text')

    act(() => checkbox.invoke('onChange')())
    wrapper.update()
    expect(wrapper.find(checkboxSelector).prop('checked')).toEqual(false)
    expect(wrapper.find(inputSelector).prop('type')).toEqual('password')
  })

  it('renders a label attached to the input', () => {
    const wrapper = render()
    const label = wrapper.find(labelSelector)

    expect(label.text()).toEqual(fieldLabel)
  })

  it('can render an error message', () => {
    const wrapper = render(false, 'oh no!')

    expect(wrapper.html()).toContain('oh no!')
  })
})
