// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { MixForm } from '../MixForm'
import { DelayFields } from '../../fields'
import { AspDispSection } from '../AspDispSection'

describe('MixForm', () => {
  const render = props => shallow(<MixForm {...props} />)

  const showAdvancedSettings = wrapper =>
    wrapper
      .find(AspDispSection)
      .first()
      .prop('toggleCollapsed')()

  let props
  beforeEach(() => {
    props = {
      focusHandlers: {
        focusedField: '',
        dirtyFields: [],
        onFieldFocus: jest.fn(),
        onFieldBlur: jest.fn(),
      },
    }
  })
  it('should NOT render delay fields initially', () => {
    const wrapper = render(props)

    const delayFields = wrapper.find(DelayFields)
    expect(delayFields).toHaveLength(0)
  })

  describe('when advanced settings are visible', () => {
    it('should render the aspirate delay fields when advanced settings are visible', () => {
      const wrapper = render(props)
      showAdvancedSettings(wrapper)
      const delayFields = wrapper.find(DelayFields)
      const aspirateDelayFields = delayFields.at(0)
      expect(aspirateDelayFields.prop('checkboxFieldName')).toBe(
        'aspirate_delay_checkbox'
      )
      expect(aspirateDelayFields.prop('secondsFieldName')).toBe(
        'aspirate_delay_seconds'
      )
      expect(aspirateDelayFields.prop('tipPositionFieldName')).toBe(
        'mix_aspirate_delay_mmFromBottom'
      )
    })
    it('should render the dispense delay fields', () => {
      const wrapper = render(props)
      showAdvancedSettings(wrapper)
      const delayFields = wrapper.find(DelayFields)
      const aspirateDelayFields = delayFields.at(1)
      expect(aspirateDelayFields.prop('checkboxFieldName')).toBe(
        'dispense_delay_checkbox'
      )
      expect(aspirateDelayFields.prop('secondsFieldName')).toBe(
        'dispense_delay_seconds'
      )
      expect(aspirateDelayFields.prop('tipPositionFieldName')).toBe(
        'mix_dispense_delay_mmFromBottom'
      )
    })
  })
})
