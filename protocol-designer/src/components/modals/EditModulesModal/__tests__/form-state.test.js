// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import * as Formik from 'formik'
import { isModuleWithCollisionIssue } from '../../../modules/utils'
import { useResetSlotOnModelChange } from '../form-state'

// TODO(mc, 2020-03-13): DANGER: mocking Formik hooks here is code smell,
// but unfortunately the async nature of validation in Formik v2 basically
// means Formik hooks can't be tested in `act`. This should be resolved by the
// removal of async validation in Formik v3
// https://github.com/jaredpalmer/formik/issues/1543
// https://github.com/jaredpalmer/formik/pull/2360
jest.mock('formik')
jest.mock('../../../modules/utils')

const useFormikContext: JestMockFn<[], $Call<typeof Formik.useFormikContext>> =
  Formik.useFormikContext

const isModuleWithCollisionIssueMock: JestMockFn<
  any,
  any
> = isModuleWithCollisionIssue

const SUPPORTED_SLOT = '1'

describe('useResetSlotOnModelChange', () => {
  const setErrors = jest.fn()
  const setTouched = jest.fn()
  const setValues = jest.fn()

  const mockFormOnce = (values, errors = {}, touched = {}) => {
    useFormikContext.mockReturnValueOnce(
      ({ values, errors, touched, setValues, setErrors, setTouched }: any)
    )
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
    jest.clearAllMocks()
  })

  it('resets the slot field when model field changes and there is a collision issue', () => {
    isModuleWithCollisionIssueMock.mockReturnValue(true)
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    mockFormOnce({ selectedModel: 'another_model', selectedSlot: 'some_slot' })
    const wrapper = render()

    act(() => {
      wrapper.setProps({})
    })

    expect(setValues).toHaveBeenCalledTimes(1)
    expect(setValues).toHaveBeenCalledWith({
      selectedModel: 'another_model',
      selectedSlot: SUPPORTED_SLOT,
    })
  })

  it('does NOT reset the slot if the model has NOT changed', () => {
    isModuleWithCollisionIssueMock.mockReturnValue(true)
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    const wrapper = render()

    act(() => {
      wrapper.setProps({})
    })

    expect(setValues).toHaveBeenCalledTimes(0)
  })

  it('does NOT reset the slot if there is NO collision issue', () => {
    isModuleWithCollisionIssueMock.mockReturnValue(false)
    mockFormOnce({ selectedModel: 'some_model', selectedSlot: 'some_slot' })
    mockFormOnce({ selectedModel: 'another_model', selectedSlot: 'some_slot' })
    const wrapper = render()

    act(() => {
      wrapper.setProps({})
    })

    expect(setValues).toHaveBeenCalledTimes(0)
  })
})
