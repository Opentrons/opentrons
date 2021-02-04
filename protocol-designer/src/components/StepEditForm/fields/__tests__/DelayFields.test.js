// @flow
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import FormTooltipText from '../../../../localization/en/tooltip'
import ApplicationText from '../../../../localization/en/application'
import * as stepFormSelectors from '../../../../step-forms/selectors'
import { CheckboxRowField, TextField, TipPositionField } from '../../fields'
import { DelayFields, type DelayFieldProps } from '../DelayFields'
import type { BaseState } from '../../../../types'
import type { FormData } from '../../../../form-types'

jest.mock('../../../../step-forms/selectors')

const getUnsavedFormMock: JestMockFn<[BaseState], ?FormData> =
  stepFormSelectors.getUnsavedForm

const mockStore = {
  dispatch: jest.fn(),
  subscribe: jest.fn(),
  getState: () => ({}),
}

describe('DelayFields', () => {
  const render = (_props: DelayFieldProps) =>
    mount(<DelayFields {..._props} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: mockStore },
    })

  describe('Aspirate Delay', () => {
    let props: DelayFieldProps
    beforeEach(() => {
      props = {
        checkboxFieldName: 'aspirate_delay_checkbox',
        secondsFieldName: 'aspirate_delay_seconds',
        propsForFields: {
          aspirate_delay_checkbox: {
            onFieldFocus: (jest.fn(): any),
            onFieldBlur: (jest.fn(): any),
            errorToShow: null,
            disabled: false,
            name: 'aspirate_delay_checkbox',
            updateValue: (jest.fn(): any),
            value: true,
          },
          aspirate_delay_seconds: {
            onFieldFocus: (jest.fn(): any),
            onFieldBlur: (jest.fn(): any),
            errorToShow: null,
            disabled: false,
            name: 'aspirate_delay_seconds',
            updateValue: (jest.fn(): any),
            value: '1',
          },
          preWetTip: {
            onFieldFocus: (jest.fn(): any),
            onFieldBlur: (jest.fn(): any),
            errorToShow: null,
            disabled: false,
            name: 'preWetTip',
            updateValue: (jest.fn(): any),
            value: true,
          },
        },
      }

      getUnsavedFormMock.mockReturnValue({
        id: 'stepId',
        stepType: 'pause',
      })
    })

    it('should render an aspirate delay field with a tip position field', () => {
      props = {
        ...props,
        tipPositionFieldName: 'aspirate_mmFromBottom',
      }

      const wrapper = render(props)
      const checkboxField = wrapper.find(CheckboxRowField)
      expect(checkboxField.prop('name')).toBe(props.checkboxFieldName)
      expect(checkboxField.prop('label')).toBe('delay')
      expect(checkboxField.prop('tooltipContent')).toBe(
        FormTooltipText.step_fields.defaults.aspirate_delay_checkbox
      )

      const secondsField = wrapper.find(TextField)
      expect(secondsField.is(TextField)).toBe(true)
      expect(secondsField.prop('name')).toBe(props.secondsFieldName)
      expect(secondsField.prop('units')).toBe(ApplicationText.units.seconds)

      const tipPosField = wrapper.find(TipPositionField)
      expect(tipPosField.is(TipPositionField)).toBe(true)
      expect(tipPosField.prop('fieldName')).toBe(props.tipPositionFieldName)
    })
    it('should render an aspirate delay field WITHOUT a tip position field', () => {
      const wrapper = render(props)

      const checkboxField = wrapper.find(CheckboxRowField)
      expect(checkboxField.prop('name')).toBe(props.checkboxFieldName)
      expect(checkboxField.prop('label')).toBe('delay')
      expect(checkboxField.prop('tooltipContent')).toBe(
        FormTooltipText.step_fields.defaults.aspirate_delay_checkbox
      )
      const secondsField = wrapper.find(TextField)
      expect(secondsField.is(TextField)).toBe(true)
      expect(secondsField.prop('name')).toBe(props.secondsFieldName)
      expect(secondsField.prop('units')).toBe(ApplicationText.units.seconds)

      expect(wrapper.find(TipPositionField).length).toBe(0)
    })
  })

  describe('Dispense Delay', () => {
    let props
    beforeEach(() => {
      props = {
        checkboxFieldName: 'dispense_delay_checkbox',
        secondsFieldName: 'dispense_delay_seconds',
        propsForFields: {
          dispense_delay_checkbox: {
            onFieldFocus: (jest.fn(): any),
            onFieldBlur: (jest.fn(): any),
            errorToShow: null,
            disabled: false,
            name: 'dispense_delay_checkbox',
            updateValue: (jest.fn(): any),
            value: true,
          },
          dispense_delay_seconds: {
            onFieldFocus: (jest.fn(): any),
            onFieldBlur: (jest.fn(): any),
            errorToShow: null,
            disabled: false,
            name: 'dispense_delay_seconds',
            updateValue: (jest.fn(): any),
            value: '1',
          },
          preWetTip: {
            onFieldFocus: (jest.fn(): any),
            onFieldBlur: (jest.fn(): any),
            errorToShow: null,
            disabled: false,
            name: 'preWetTip',
            updateValue: (jest.fn(): any),
            value: true,
          },
        },
      }

      getUnsavedFormMock.mockReturnValue({
        id: 'stepId',
        stepType: 'pause',
      })
    })

    it('should render an dispense delay field with a tip position field', () => {
      props = { ...props, tipPositionFieldName: 'dispense_delay_mmFromBottom' }

      const wrapper = render(props)

      const checkboxField = wrapper.find(CheckboxRowField)
      expect(checkboxField.prop('name')).toBe(props.checkboxFieldName)
      expect(checkboxField.prop('label')).toBe('delay')
      expect(checkboxField.prop('tooltipContent')).toBe(
        FormTooltipText.step_fields.defaults.dispense_delay_checkbox
      )
      const secondsField = wrapper.find(TextField)
      expect(secondsField.is(TextField)).toBe(true)
      expect(secondsField.prop('name')).toBe(props.secondsFieldName)
      expect(secondsField.prop('units')).toBe(ApplicationText.units.seconds)

      const tipPosField = wrapper.find(TipPositionField)
      expect(tipPosField.is(TipPositionField)).toBe(true)
      expect(tipPosField.prop('fieldName')).toBe(props.tipPositionFieldName)
    })

    it('should render an dispense delay field WITHOUT a tip position field', () => {
      const wrapper = render(props)

      const checkboxField = wrapper.find(CheckboxRowField)
      expect(checkboxField.prop('name')).toBe(props.checkboxFieldName)
      expect(checkboxField.prop('label')).toBe('delay')
      expect(checkboxField.prop('tooltipContent')).toBe(
        FormTooltipText.step_fields.defaults.dispense_delay_checkbox
      )
      const secondsField = wrapper.find(TextField)
      expect(secondsField.is(TextField)).toBe(true)
      expect(secondsField.prop('name')).toBe(props.secondsFieldName)
      expect(secondsField.prop('units')).toBe(ApplicationText.units.seconds)

      expect(wrapper.find(TipPositionField).length).toBe(0)
    })
  })
})
