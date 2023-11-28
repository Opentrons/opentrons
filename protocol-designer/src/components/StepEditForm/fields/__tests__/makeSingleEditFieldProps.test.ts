import { makeSingleEditFieldProps } from '../makeSingleEditFieldProps'
import {
  getDisabledFields,
  getDefaultsForStepType,
} from '../../../../steplist/formLevel'
import { getFieldErrors } from '../../../../steplist/fieldLevel'
import * as stepEditFormUtils from '../../utils'
import { FormData, HydratedFormdata } from '../../../../form-types'
jest.mock('../../../../steplist/formLevel')
jest.mock('../../../../steplist/fieldLevel')

const getFieldDefaultTooltipSpy = jest.spyOn(
  stepEditFormUtils,
  'getFieldDefaultTooltip'
)

const getSingleSelectDisabledTooltipSpy = jest.spyOn(
  stepEditFormUtils,
  'getSingleSelectDisabledTooltip'
)

const getDisabledFieldsMock = getDisabledFields as jest.MockedFunction<
  typeof getDisabledFields
>
const getDefaultsForStepTypeMock = getDefaultsForStepType as jest.MockedFunction<
  typeof getDefaultsForStepType
>
const getFieldErrorsMock = getFieldErrors as jest.MockedFunction<
  typeof getFieldErrors
>

beforeEach(() => {
  getFieldDefaultTooltipSpy.mockImplementation(name => `tooltip for ${name}`)
  getSingleSelectDisabledTooltipSpy.mockImplementation(
    name => `disabled tooltip for ${name}`
  )
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('makeSingleEditFieldProps', () => {
  it('should create correct props for all fields in the given stepType', () => {
    const focusedField = 'focused_error_field'
    const dirtyFields = ['dirty_error_field', 'focused_error_field']

    const focus: any = jest.fn()
    const blur: any = jest.fn()
    const handleChangeFormInput: any = jest.fn()

    const formData: any = {
      stepType: 'fakeStepType',
      some_field: '123',
      disabled_field: '404',
      pristine_error_field: '',
      dirty_error_field: '',
      focused_error_field: '',
    }

    getDisabledFieldsMock.mockImplementation(
      (form: HydratedFormdata): Set<string> => {
        expect(form).toBe(formData)
        const disabled = new Set<string>()
        disabled.add('disabled_field')
        return disabled
      }
    )

    getDefaultsForStepTypeMock.mockImplementation(stepType => {
      expect(stepType).toEqual('fakeStepType')
      return {
        some_field: 'default',
        disabled_field: 'default',
        pristine_error_field: '',
        dirty_error_field: '',
        focused_error_field: '',
      }
    })

    getFieldErrorsMock.mockImplementation((name, value) => {
      // pretend all the '*_error_field' fields have errors
      // (though downstream of getFieldErrors, these errors won't be shown
      // in errorToShow if field is pristine/focused)
      if (
        name === 'pristine_error_field' ||
        name === 'dirty_error_field' ||
        name === 'focused_error_field'
      ) {
        return ['invalid value', 'field is required']
      }
      return []
    })

    const focusHandlers = {
      focusedField,
      dirtyFields,
      focus,
      blur,
    }
    const result = makeSingleEditFieldProps(
      focusHandlers,
      formData,
      handleChangeFormInput,
      formData
    )
    expect(result).toEqual({
      some_field: {
        disabled: false,
        errorToShow: null,
        name: 'some_field',
        onFieldBlur: expect.anything(),
        onFieldFocus: expect.anything(),
        updateValue: expect.anything(),
        value: '123',
        tooltipContent: 'tooltip for some_field',
      },
      disabled_field: {
        disabled: true,
        errorToShow: null,
        name: 'disabled_field',
        onFieldBlur: expect.anything(),
        onFieldFocus: expect.anything(),
        updateValue: expect.anything(),
        value: '404',
        tooltipContent: 'disabled tooltip for disabled_field',
      },
      pristine_error_field: {
        disabled: false,
        errorToShow: null,
        name: 'pristine_error_field',
        onFieldBlur: expect.anything(),
        onFieldFocus: expect.anything(),
        updateValue: expect.anything(),
        value: '',
        tooltipContent: 'tooltip for pristine_error_field',
      },
      dirty_error_field: {
        disabled: false,
        errorToShow: 'invalid value, field is required',
        name: 'dirty_error_field',
        onFieldBlur: expect.anything(),
        onFieldFocus: expect.anything(),
        updateValue: expect.anything(),
        value: '',
        tooltipContent: 'tooltip for dirty_error_field',
      },
      focused_error_field: {
        disabled: false,
        errorToShow: null,
        name: 'focused_error_field',
        onFieldBlur: expect.anything(),
        onFieldFocus: expect.anything(),
        updateValue: expect.anything(),
        value: '',
        tooltipContent: 'tooltip for focused_error_field',
      },
    })

    // ensure the callbacks are wired up
    ;[
      'some_field',
      'disabled_field',
      'pristine_error_field',
      'dirty_error_field',
      'focused_error_field',
    ].forEach(name => {
      const { onFieldBlur, onFieldFocus, updateValue } = result[name]

      onFieldBlur()
      expect(blur).toHaveBeenCalledWith(name)

      onFieldFocus()
      expect(focus).toHaveBeenCalledWith(name)

      updateValue('foo')
      expect(handleChangeFormInput).toHaveBeenCalledWith(name, 'foo')

      expect(getFieldErrorsMock).toHaveBeenCalledWith(name, formData[name])
    })
  })
})
