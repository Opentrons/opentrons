import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { CheckboxRowField, DelayFields, WellOrderField } from '../../fields'
import { SourceDestFields } from '../MoveLiquidForm/SourceDestFields'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { FormData } from '../../../../form-types'

jest.mock('../../../../step-forms')
jest.mock('../../utils')

const getUnsavedFormMock = stepFormSelectors.getUnsavedForm as jest.MockedFunction<
  typeof stepFormSelectors.getUnsavedForm
>

jest.mock('../../fields/', () => {
  const actualFields = jest.requireActual('../../fields')

  return {
    ...actualFields,
    BlowoutLocationField: () => <div></div>,
    ChangeTipField: () => <div></div>,
    CheckboxRowField: () => <div></div>,
    DelayFields: () => <div></div>,
    FlowRateField: () => <div></div>,
    LabwareField: () => <div></div>,
    PipetteField: () => <div></div>,
    TextField: () => <div></div>,
    TipPositionField: () => <div></div>,
    VolumeField: () => <div></div>,
    WellOrderField: () => <div></div>,
    WellSelectionField: () => <div></div>,
  }
})
const fixtureTipRack10ul = {
  ...fixture_tiprack_10_ul,
  version: 2,
} as LabwareDefinition2

const fixtureTipRack300uL = {
  ...fixture_tiprack_300_ul,
  version: 2,
} as LabwareDefinition2
const ten = '10uL'
const threeHundred = '300uL'
const sourceLab = 'sourceLabware'
describe('SourceDestFields', () => {
  let store: any
  let props: React.ComponentProps<typeof SourceDestFields>
  beforeEach(() => {
    props = {
      formData: {
        aspirate_wellOrder_first: 'r2l',
        aspirate_wellOrder_second: 'b2t',
        dispense_wellOrder_first: 'l2r',
        dispense_wellOrder_second: 't2b',
      } as any,
      propsForFields: {
        aspirate_delay_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'aspirate_delay_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        aspirate_mix_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'aspirate_mix_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        aspirate_touchTip_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'aspirate_touchTip_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        aspirate_airGap_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'aspirate_airGap_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        aspirate_wellOrder_first: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'aspirate_wellOrder_first',
          updateValue: jest.fn() as any,
          value: true,
        },
        aspirate_wellOrder_second: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'aspirate_wellOrder_second',
          updateValue: jest.fn() as any,
          value: true,
        },
        dispense_airGap_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'dispense_airGap_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        dispense_delay_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'dispense_delay_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        dispense_mix_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'dispense_mix_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        dispense_touchTip_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'dispense_touchTip_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        dispense_wellOrder_first: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'dispense_wellOrder_first',
          updateValue: jest.fn() as any,
          value: true,
        },
        dispense_wellOrder_second: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'dispense_wellOrder_second',
          updateValue: jest.fn() as any,
          value: true,
        },
        blowout_checkbox: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'blowout_checkbox',
          updateValue: jest.fn() as any,
          value: true,
        },
        preWetTip: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'preWetTip',
          updateValue: jest.fn() as any,
          value: true,
        },
      },
      prefix: 'aspirate',
      allLabware: {
        [ten]: fixtureTipRack10ul,
        [threeHundred]: fixtureTipRack300uL,
        [sourceLab]: { parameters: { quirks: ['touchTipDisabled'] } } as any,
      },
    }
    store = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
    getUnsavedFormMock.mockReturnValue({
      stepType: 'moveLiquid',
    } as FormData)
  })

  const render = (props: React.ComponentProps<typeof SourceDestFields>) =>
    mount(
      <Provider store={store}>
        <SourceDestFields {...props} />
      </Provider>
    )

  describe('Aspirate section', () => {
    it('should render the correct checkboxes', () => {
      const wrapper = render(props)
      const checkboxes = wrapper.find(CheckboxRowField)

      const delayFields = wrapper.find(DelayFields)
      expect(delayFields.props()).toMatchObject({
        checkboxFieldName: 'aspirate_delay_checkbox',
        secondsFieldName: 'aspirate_delay_seconds',
        tipPositionFieldName: 'aspirate_delay_mmFromBottom',
      })

      expect(checkboxes.at(0).prop('name')).toBe('preWetTip')
      expect(checkboxes.at(1).prop('name')).toBe('aspirate_mix_checkbox')
      expect(checkboxes.at(2).prop('name')).toBe('aspirate_touchTip_checkbox')
      expect(checkboxes.at(3).prop('name')).toBe('aspirate_airGap_checkbox')
    })
    it('should render a well order field', () => {
      const wrapper = render(props)
      const wellOrderField = wrapper.find(WellOrderField)

      expect(wellOrderField.props()).toMatchObject({
        prefix: 'aspirate',
        label: 'Well order',
        firstValue: 'r2l',
        secondValue: 'b2t',
        updateFirstWellOrder:
          props.propsForFields.aspirate_wellOrder_first.updateValue,
        updateSecondWellOrder:
          props.propsForFields.aspirate_wellOrder_second.updateValue,
      })
    })
  })
  describe('Dispense section', () => {
    beforeEach(() => {
      props = { ...props, prefix: 'dispense' }
    })
    it('should render the correct checkboxes', () => {
      const wrapper = render(props)
      const checkboxes = wrapper.find(CheckboxRowField)

      const delayFields = wrapper.find(DelayFields)
      expect(delayFields.props()).toMatchObject({
        checkboxFieldName: 'dispense_delay_checkbox',
        secondsFieldName: 'dispense_delay_seconds',
        tipPositionFieldName: 'dispense_delay_mmFromBottom',
      })
      expect(checkboxes.at(0).prop('name')).toBe('dispense_mix_checkbox')
      expect(checkboxes.at(1).prop('name')).toBe('dispense_touchTip_checkbox')
      expect(checkboxes.at(2).prop('name')).toBe('blowout_checkbox')
      expect(checkboxes.at(3).prop('name')).toBe('dispense_airGap_checkbox')
    })
    it('should render a well order field', () => {
      const wrapper = render(props)
      const wellOrderField = wrapper.find(WellOrderField)

      expect(wellOrderField.props()).toMatchObject({
        prefix: 'dispense',
        label: 'Well order',
        firstValue: 'l2r',
        secondValue: 't2b',
        updateFirstWellOrder:
          props.propsForFields.dispense_wellOrder_first.updateValue,
        updateSecondWellOrder:
          props.propsForFields.dispense_wellOrder_second.updateValue,
      })
    })
  })
})
