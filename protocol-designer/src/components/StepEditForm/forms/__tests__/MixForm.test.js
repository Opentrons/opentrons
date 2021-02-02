// @flow
import React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import { MixForm } from '../MixForm'
import { AspDispSection } from '../AspDispSection'

const { DelayFields } = jest.requireActual('../../fields')

jest.mock('../../fields/', () => {
  const actualFields = jest.requireActual('../../fields')

  return {
    ...actualFields,
    LabwareField: () => <div></div>,
    PipetteField: () => <div></div>,
    FlowRateField: () => <div></div>,
    VolumeField: () => <div></div>,
    ChangeTipField: () => <div></div>,
    TipPositionField: () => <div></div>,
    WellOrderField: () => <div></div>,
    WellSelectionField: () => <div></div>,
  }
})

jest.mock('../../fields/FieldConnector', () => ({
  FieldConnector: () => <div></div>,
}))

const mockStore = {
  dispatch: jest.fn(),
  subscribe: jest.fn(),
  getState: () => ({}),
}

describe('MixForm', () => {
  const render = props =>
    mount(<MixForm {...props} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: mockStore },
    })

  const showAdvancedSettings = wrapper => {
    wrapper.find(AspDispSection).first().invoke('toggleCollapsed')()
  }

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
      wrapper.update()

      const delayFields = wrapper.find(DelayFields)

      const aspirateDelayFields = delayFields.at(0)
      expect(aspirateDelayFields.prop('checkboxFieldName')).toBe(
        'aspirate_delay_checkbox'
      )
      expect(aspirateDelayFields.prop('secondsFieldName')).toBe(
        'aspirate_delay_seconds'
      )
      // no tip position field
      expect(aspirateDelayFields.prop('tipPositionFieldName')).toBe(undefined)
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
      // no tip position field
      expect(aspirateDelayFields.prop('tipPositionFieldName')).toBe(undefined)
    })
  })
})
