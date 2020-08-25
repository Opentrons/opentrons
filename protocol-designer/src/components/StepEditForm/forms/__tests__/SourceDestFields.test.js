// @flow
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { SourceDestFields } from '../MoveLiquidForm/SourceDestFields'
import { CheckboxRowField } from '../../fields'

import type { BaseState } from '../../../../types'
import { selectors as stepFormSelectors } from '../../../../step-forms'

jest.mock('../../../../feature-flags')
jest.mock('../../../../step-forms')
jest.mock('../../utils')

const getUnsavedFormMock: JestMockFn<[BaseState], any> =
  stepFormSelectors.getUnsavedForm

describe('SourceDestFields', () => {
  let store
  let props
  beforeEach(() => {
    props = {
      focusHandlers: {
        focusedField: '',
        dirtyFields: [],
        onFieldFocus: jest.fn(),
        onFieldBlur: jest.fn(),
      },
      prefix: 'aspirate',
    }
    store = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
    getUnsavedFormMock.mockReturnValue({})
  })

  const render = props =>
    mount(
      <Provider store={store}>
        <SourceDestFields {...props} />
      </Provider>
    )

  describe('Aspirate section', () => {
    it('should render the correct checkboxes', () => {
      const wrapper = render(props)
      const checkboxes = wrapper.find(CheckboxRowField)
      expect(checkboxes.at(0).prop('name')).toBe('preWetTip')
      expect(checkboxes.at(1).prop('name')).toBe('aspirate_mix_checkbox')
      expect(checkboxes.at(2).prop('name')).toBe('aspirate_delay_checkbox')
      expect(checkboxes.at(3).prop('name')).toBe('aspirate_touchTip_checkbox')
      expect(checkboxes.at(4).prop('name')).toBe('aspirate_airGap_checkbox')
    })
  })
  describe('Dispense section', () => {
    it('should render the correct checkboxes', () => {
      props.prefix = 'dispense'
      const wrapper = render(props)
      const checkboxes = wrapper.find(CheckboxRowField)
      expect(checkboxes.at(0).prop('name')).toBe('dispense_delay_checkbox')
      expect(checkboxes.at(1).prop('name')).toBe('dispense_mix_checkbox')
      expect(checkboxes.at(2).prop('name')).toBe('dispense_touchTip_checkbox')
      expect(checkboxes.at(3).prop('name')).toBe('blowout_checkbox')
    })
  })
})
