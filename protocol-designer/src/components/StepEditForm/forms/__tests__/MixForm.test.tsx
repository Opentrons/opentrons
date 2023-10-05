import * as React from 'react'
import { mount, ReactWrapper } from 'enzyme'
import { Provider } from 'react-redux'
import * as stepFormSelectors from '../../../../step-forms/selectors'
import { DropTipField } from '../../fields/DropTipField/index'
import { WellOrderField } from '../../fields'
import { MixForm } from '../MixForm'
import { AspDispSection } from '../AspDispSection'
import type { FormData } from '../../../../form-types'

const { DelayFields } = jest.requireActual('../../fields')

jest.mock('../../../../step-forms/selectors')
jest.mock('../../fields/DropTipField/index')
const getUnsavedFormMock = stepFormSelectors.getUnsavedForm as jest.MockedFunction<
  typeof stepFormSelectors.getUnsavedForm
>
const mockDropTipField = DropTipField as jest.MockedFunction<
  typeof DropTipField
>
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

const mockStore = {
  dispatch: jest.fn(),
  subscribe: jest.fn(),
  getState: () => ({}),
}

type MixFormProps = React.ComponentProps<typeof MixForm>

describe('MixForm', () => {
  let props: MixFormProps

  const render = (_props: MixFormProps) =>
    mount(<MixForm {..._props} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: mockStore },
    })

  const showAdvancedSettings = (wrapper: ReactWrapper) => {
    wrapper.find(AspDispSection).first().invoke('toggleCollapsed')()
  }

  beforeEach(() => {
    getUnsavedFormMock.mockReturnValue({
      stepType: 'mix',
    } as FormData)
    mockDropTipField.mockReturnValue(<div>mock drop tip field</div>)

    props = {
      formData: {
        stepType: 'mix',
        mix_wellOrder_first: 'r2l',
        mix_wellOrder_second: 'b2t',
      } as any,
      focusHandlers: {
        blur: jest.fn(),
        focus: jest.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      propsForFields: {
        pipette: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'pipette',
          updateValue: jest.fn() as any,
          value: null,
        },
        mix_wellOrder_first: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'mix_wellOrder_first',
          updateValue: jest.fn() as any,
          value: null,
        },
        mix_wellOrder_second: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'mix_wellOrder_second',
          updateValue: jest.fn() as any,
          value: null,
        },
        dropTip_location: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'dropTip_location',
          updateValue: jest.fn() as any,
          value: null,
        },
      },
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should NOT render delay fields initially', () => {
    const wrapper = render(props)

    const delayFields = wrapper.find(DelayFields)
    expect(delayFields).toHaveLength(0)
  })

  describe('when advanced settings are visible', () => {
    it('should render the aspirate delay fields', () => {
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
    it('should render the mix well order field', () => {
      const wrapper = render(props)
      showAdvancedSettings(wrapper)
      const wellOrderField = wrapper.find(WellOrderField)
      expect(wellOrderField.props()).toMatchObject({
        prefix: 'mix',
        label: 'Well order',
        firstValue: 'r2l',
        secondValue: 'b2t',
        updateFirstWellOrder:
          props.propsForFields.mix_wellOrder_first.updateValue,
        updateSecondWellOrder:
          props.propsForFields.mix_wellOrder_second.updateValue,
      })
    })
  })
})
