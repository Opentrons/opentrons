// @flow
import { shallow } from 'enzyme'
import * as React from 'react'

import {
  Btn,
  BUTTON_TYPE_RESET,
  BUTTON_TYPE_SUBMIT,
  LightSecondaryBtn,
  PrimaryBtn,
  SecondaryBtn,
  TertiaryBtn,
} from '..'

describe('Btn primitive component', () => {
  it('should be an <button> with css reset and type: button', () => {
    const wrapper = shallow(<Btn />)

    expect(wrapper).toHaveStyleRule('appearance', 'none')
    expect(wrapper).toHaveStyleRule('cursor', 'pointer')
    expect(wrapper).toHaveStyleRule('padding', '0')
    expect(wrapper).toHaveStyleRule('border-width', '0')
    expect(wrapper).toHaveStyleRule('border-style', 'solid')
    expect(wrapper).toHaveStyleRule('background-color', 'transparent')
    expect(wrapper.find('button').prop('type')).toBe('button')
  })

  it('should be clickable', () => {
    const handleClick = jest.fn()
    const wrapper = shallow(<Btn onClick={handleClick} />)

    wrapper.find('button').simulate('click')
    expect(handleClick).toHaveBeenCalled()
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Btn>
        <span data-test="child" />
      </Btn>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })

  it('should allow type to be changed', () => {
    const wrapper = shallow(<Btn type={BUTTON_TYPE_SUBMIT} />)
    expect(wrapper.find('button').prop('type')).toBe('submit')

    wrapper.setProps({ type: BUTTON_TYPE_RESET })
    expect(wrapper.find('button').prop('type')).toBe('reset')
  })

  it('should set cursor to default when disabled', () => {
    const wrapper = shallow(<Btn type={BUTTON_TYPE_SUBMIT} disabled />)

    expect(wrapper).toHaveStyleRule('cursor', 'default', {
      modifier: ':disabled',
    })
  })

  describe('variants', () => {
    it('should render a primary button variant', () => {
      const wrapper = shallow(<PrimaryBtn />)

      expect(wrapper).toHaveStyleRule('background-color', '#4a4a4a')
      expect(wrapper).toHaveStyleRule('border-radius', '2px')
      expect(wrapper).toHaveStyleRule('color', '#ffffff')
      expect(wrapper).toHaveStyleRule('font-size', '0.875rem')
      expect(wrapper).toHaveStyleRule('font-weight', '600')
      expect(wrapper).toHaveStyleRule('line-height', '1.4')
      expect(wrapper).toHaveStyleRule('padding-left', '2rem')
      expect(wrapper).toHaveStyleRule('padding-right', '2rem')
      expect(wrapper).toHaveStyleRule('padding-top', '0.5rem')
      expect(wrapper).toHaveStyleRule('padding-bottom', '0.5rem')
      expect(wrapper).toHaveStyleRule('text-transform', 'uppercase')

      // focus
      expect(wrapper).toHaveStyleRule('background-color', '#000000', {
        modifier: ':focus',
      })

      // hover
      expect(wrapper).toHaveStyleRule('background-color', '#000000', {
        modifier: ':hover',
      })

      // active
      expect(wrapper).toHaveStyleRule('background-color', '#6c6c6c', {
        modifier: ':active',
      })

      // disabled
      expect(wrapper).toHaveStyleRule('background-color', '#e6e6e6', {
        modifier: ':disabled',
      })
      expect(wrapper).toHaveStyleRule('color', '#9b9b9b', {
        modifier: ':disabled',
      })
    })

    it('should render a secondary button variant', () => {
      const wrapper = shallow(<SecondaryBtn />)

      expect(wrapper).toHaveStyleRule('background-color', '#ffffff')
      expect(wrapper).toHaveStyleRule('border-radius', '2px')
      expect(wrapper).toHaveStyleRule('border-width', '1px')
      expect(wrapper).toHaveStyleRule('color', '#4a4a4a')
      expect(wrapper).toHaveStyleRule('font-size', '0.875rem')
      expect(wrapper).toHaveStyleRule('font-weight', '600')
      expect(wrapper).toHaveStyleRule('line-height', '1.4')
      expect(wrapper).toHaveStyleRule('padding-left', '2rem')
      expect(wrapper).toHaveStyleRule('padding-right', '2rem')
      expect(wrapper).toHaveStyleRule('padding-top', '0.5rem')
      expect(wrapper).toHaveStyleRule('padding-bottom', '0.5rem')
      expect(wrapper).toHaveStyleRule('text-transform', 'uppercase')

      // focus
      expect(wrapper).toHaveStyleRule('background-color', '#e6e6e6', {
        modifier: ':focus',
      })

      // hover
      expect(wrapper).toHaveStyleRule('background-color', '#e6e6e6', {
        modifier: ':hover',
      })

      // active
      expect(wrapper).toHaveStyleRule('background-color', '#d2d2d2', {
        modifier: ':active',
      })

      // disabled
      expect(wrapper).toHaveStyleRule('background-color', '#ffffff', {
        modifier: ':disabled',
      })
      expect(wrapper).toHaveStyleRule('color', '#9b9b9b', {
        modifier: ':disabled',
      })
    })

    it('should render a light secondary button variant', () => {
      const wrapper = shallow(<LightSecondaryBtn />)

      expect(wrapper).toHaveStyleRule('background-color', 'transparent')
      expect(wrapper).toHaveStyleRule('border-radius', '2px')
      expect(wrapper).toHaveStyleRule('border-width', '1px')
      expect(wrapper).toHaveStyleRule('color', '#ffffff')
      expect(wrapper).toHaveStyleRule('font-size', '0.875rem')
      expect(wrapper).toHaveStyleRule('font-weight', '600')
      expect(wrapper).toHaveStyleRule('line-height', '1.4')
      expect(wrapper).toHaveStyleRule('padding-left', '2rem')
      expect(wrapper).toHaveStyleRule('padding-right', '2rem')
      expect(wrapper).toHaveStyleRule('padding-top', '0.5rem')
      expect(wrapper).toHaveStyleRule('padding-bottom', '0.5rem')
      expect(wrapper).toHaveStyleRule('text-transform', 'uppercase')

      // focus
      expect(wrapper).toHaveStyleRule(
        'background-color',
        'rgba(255,255,255,0.1)',
        {
          modifier: ':focus',
        }
      )

      // hover
      expect(wrapper).toHaveStyleRule(
        'background-color',
        'rgba(255,255,255,0.1)',
        {
          modifier: ':hover',
        }
      )

      // disabled
      expect(wrapper).toHaveStyleRule('background-color', 'transparent', {
        modifier: ':disabled',
      })
      expect(wrapper).toHaveStyleRule('color', '#9b9b9b', {
        modifier: ':disabled',
      })
    })

    it('should render a tertiary button variant', () => {
      const wrapper = shallow(<TertiaryBtn />)

      expect(wrapper).toHaveStyleRule('background-color', 'transparent')
      expect(wrapper).toHaveStyleRule('border-radius', '2px')
      expect(wrapper).toHaveStyleRule('border-width', '0')
      expect(wrapper).toHaveStyleRule('color', '#ffffff')
      expect(wrapper).toHaveStyleRule('font-size', '0.875rem')
      expect(wrapper).toHaveStyleRule('font-weight', '600')
      expect(wrapper).toHaveStyleRule('line-height', '1.4')
      expect(wrapper).toHaveStyleRule('padding-left', '2rem')
      expect(wrapper).toHaveStyleRule('padding-right', '2rem')
      expect(wrapper).toHaveStyleRule('padding-top', '0.5rem')
      expect(wrapper).toHaveStyleRule('padding-bottom', '0.5rem')
      expect(wrapper).toHaveStyleRule('text-transform', 'uppercase')

      // focus
      expect(wrapper).toHaveStyleRule(
        'background-color',
        'rgba(255,255,255,0.1)',
        {
          modifier: ':focus',
        }
      )

      // hover
      expect(wrapper).toHaveStyleRule(
        'background-color',
        'rgba(255,255,255,0.1)',
        {
          modifier: ':hover',
        }
      )

      // active
      expect(wrapper).toHaveStyleRule(
        'background-color',
        'rgba(255,255,255,0.2)',
        {
          modifier: ':active',
        }
      )

      // disabled
      expect(wrapper).toHaveStyleRule('background-color', 'transparent', {
        modifier: ':disabled',
      })
      expect(wrapper).toHaveStyleRule('color', '#9b9b9b', {
        modifier: ':disabled',
      })
    })
  })
})
