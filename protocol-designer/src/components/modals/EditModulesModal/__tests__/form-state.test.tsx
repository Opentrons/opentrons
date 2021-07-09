import * as React from 'react'
import { mount } from 'enzyme'
import * as Formik from 'formik'
import { isModuleWithCollisionIssue } from '../../../modules/utils'
import { useResetSlotOnModelChange } from '../form-state'
import { EditModulesFormValues } from '../index'

// TODO(mc, 2020-03-13): DANGER: mocking Formik hooks here is code smell,
// but unfortunately the async nature of validation in Formik v2 basically
// means Formik hooks can't be tested in `act`. This should be resolved by the
// removal of async validation in Formik v3
// https://github.com/jaredpalmer/formik/issues/1543
// https://github.com/jaredpalmer/formik/pull/2360
jest.mock('formik')
jest.mock('../../../modules/utils')

const useFormikContext = Formik.useFormikContext as jest.MockedFunction<
  typeof Formik.useFormikContext
>

const isModuleWithCollisionIssueMock: jest.MockedFunction<any> = isModuleWithCollisionIssue

const SUPPORTED_SLOT = '1'

describe('useResetSlotOnModelChange', () => {
  const setErrors = jest.fn()
  const setTouched = jest.fn()
  const setValues = jest.fn()

  const mockFormOnce = (
    values: EditModulesFormValues,
    errors = {},
    touched = {}
  ) => {
    useFormikContext.mockReturnValueOnce({
      values,
      errors,
      touched,
      setValues,
      setErrors,
      setTouched,
    } as any)
  }

  const TestUseResetSlotOnModelChange = () => {
    useResetSlotOnModelChange(SUPPORTED_SLOT)
    return <></>
  }

  const render = () => {
    return mount(<TestUseResetSlotOnModelChange />)
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('resets the slot field when model field changes and there is a collision issue', () => {
    isModuleWithCollisionIssueMock.mockReturnValue(true)
    // @ts-expect-error (ce, 2021-06-23)  Type '"some_model"' is not assignable to type '"magneticModuleV1" | "magneticModuleV2" | "temperatureModuleV1" | "temperatureModuleV2" | "thermocyclerModuleV1" | null'.
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    // @ts-expect-error (ce, 2021-06-23)  Type '"another_model"' is not assignable to type '"magneticModuleV1" | "magneticModuleV2" | "temperatureModuleV1" | "temperatureModuleV2" | "thermocyclerModuleV1" | null'.
    mockFormOnce({ selectedModel: 'another_model', selectedSlot: 'some_slot' })
    const wrapper = render()

    wrapper.setProps({})

    expect(setValues).toHaveBeenCalledTimes(1)
    expect(setValues).toHaveBeenCalledWith({
      selectedModel: 'another_model',
      selectedSlot: SUPPORTED_SLOT,
    })
  })

  it('does NOT reset the slot if the model has NOT changed', () => {
    isModuleWithCollisionIssueMock.mockReturnValue(true)
    // @ts-expect-error (ce, 2021-06-23)  Type '"some_model"' is not assignable to type '"magneticModuleV1" | "magneticModuleV2" | "temperatureModuleV1" | "temperatureModuleV2" | "thermocyclerModuleV1" | null'.
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    // @ts-expect-error (ce, 2021-06-23)  Type '"some_model"' is not assignable to type '"magneticModuleV1" | "magneticModuleV2" | "temperatureModuleV1" | "temperatureModuleV2" | "thermocyclerModuleV1" | null'.
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    const wrapper = render()

    wrapper.setProps({})

    expect(setValues).toHaveBeenCalledTimes(0)
  })

  it('does NOT reset the slot if there is NO collision issue', () => {
    isModuleWithCollisionIssueMock.mockReturnValue(false)
    // @ts-expect-error (ce, 2021-06-23)  Type '"some_model"' is not assignable to type '"magneticModuleV1" | "magneticModuleV2" | "temperatureModuleV1" | "temperatureModuleV2" | "thermocyclerModuleV1" | null'.
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    // @ts-expect-error (ce, 2021-06-23)  Type '"another_model"' is not assignable to type '"magneticModuleV1" | "magneticModuleV2" | "temperatureModuleV1" | "temperatureModuleV2" | "thermocyclerModuleV1" | null'.
    mockFormOnce({ selectedModel: 'another_model', selectedSlot: 'some_slot' })
    const wrapper = render()

    wrapper.setProps({})

    expect(setValues).toHaveBeenCalledTimes(0)
  })
})
