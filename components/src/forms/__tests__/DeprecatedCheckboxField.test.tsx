import * as React from 'react'
import { mount } from 'enzyme'

import { DeprecatedCheckboxField } from '../DeprecatedCheckboxField'
import { Icon } from '../../icons'

describe('DeprecatedCheckboxField', () => {
  describe('DeprecatedCheckboxField', () => {
    it('renders a checked icon when value === true', () => {
      const wrapper = mount(
        <DeprecatedCheckboxField onChange={jest.fn()} value={true} />
      )
      const icon = wrapper.find(Icon)

      expect(icon.prop('name')).toEqual('checkbox-marked')
    })

    it('sets input checked attribute to true when value === true', () => {
      const wrapper = mount(
        <DeprecatedCheckboxField onChange={jest.fn()} value={true} />
      )

      const input = wrapper.find('input')
      expect(input.prop('checked')).toBe(true)
    })

    it('renders an unchecked icon when value === false', () => {
      const wrapper = mount(
        <DeprecatedCheckboxField onChange={jest.fn()} value={false} />
      )
      const icon = wrapper.find(Icon)

      expect(icon.prop('name')).toEqual('checkbox-blank-outline')
    })

    it('sets input checked attribute to false when value === false', () => {
      const wrapper = mount(
        <DeprecatedCheckboxField onChange={jest.fn()} value={false} />
      )

      const input = wrapper.find('input')
      expect(input.prop('checked')).toBe(false)
    })

    it('renders an unchecked icon when no value prop', () => {
      const wrapper = mount(<DeprecatedCheckboxField onChange={jest.fn()} />)
      const icon = wrapper.find(Icon)

      expect(icon).toBeDefined()
      expect(icon.prop('name')).toEqual('checkbox-blank-outline')
    })

    it('sets input checked attribute to false when no value prop', () => {
      const wrapper = mount(<DeprecatedCheckboxField onChange={jest.fn()} />)

      const input = wrapper.find('input')
      expect(input.prop('checked')).toBe(false)
    })
  })

  describe('indeterminate DeprecatedCheckboxField', () => {
    it(' renders a minux box icon', () => {
      const wrapper = mount(
        <DeprecatedCheckboxField onChange={jest.fn()} isIndeterminate />
      )
      const icon = wrapper.find(Icon)
      expect(icon.prop('name')).toEqual('minus-box')
    })

    it('passes isIndeterimate prop and adds input indeterminate attribute', () => {
      const wrapper = mount(
        <DeprecatedCheckboxField onChange={jest.fn()} isIndeterminate />
      )

      const input = wrapper.find('input')
      expect(input.prop('indeterminate')).toBeTruthy()
    })
  })
})
