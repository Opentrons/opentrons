import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest'
import noop from 'lodash/noop'
import { makeBatchEditFieldProps } from '../makeBatchEditFieldProps'
import * as stepEditFormUtils from '../../StepEditForm/utils'

const getFieldDefaultTooltipSpy = vi.spyOn(
  stepEditFormUtils,
  'getFieldDefaultTooltip'
)

const getIndeterminateTooltipSpy = vi.spyOn(
  stepEditFormUtils,
  'getFieldIndeterminateTooltip'
)

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

const tMock = (key: string) => key

beforeEach(() => {
  getFieldDefaultTooltipSpy.mockImplementation(name => `tooltip for ${name}`)
  getIndeterminateTooltipSpy.mockImplementation(name => `tooltip for ${name}`)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('makeBatchEditFieldProps', () => {
  it('should create correct props for all fields with the given MultiselectFieldValues obj', () => {
    const fieldValues = {
      aspirate_flowRate: {
        isIndeterminate: false,
        value: '1.2',
      },
    }
    const handleChangeFormInput: any = vi.fn()

    const disabledFields = {}

    const result = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput,
      tMock
    )

    expect(result).toEqual({
      aspirate_flowRate: {
        disabled: false,
        errorToShow: null,
        isIndeterminate: false,
        name: 'aspirate_flowRate',
        onFieldBlur: noop,
        onFieldFocus: noop,
        updateValue: expect.anything(),
        value: '1.2',
        tooltipContent: 'tooltip for aspirate_flowRate',
      },
    })

    result.aspirate_flowRate.updateValue('42')
    expect(handleChangeFormInput).toHaveBeenCalledWith(
      'aspirate_flowRate',
      '42'
    )
  })

  it('should make field disabled if it is represented in disabledFields, and show disabled explanation tooltip', () => {
    const fieldValues = {
      aspirate_flowRate: {
        value: '1.2',
        isIndeterminate: false,
      },
    }
    const handleChangeFormInput: any = vi.fn()

    const disabledFields = {
      aspirate_flowRate: 'Disabled explanation text here',
    }

    const result = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput,
      tMock
    )

    expect(result.aspirate_flowRate.disabled).toBe(true)
    expect(result.aspirate_flowRate.tooltipContent).toBe(
      'Disabled explanation text here'
    )
  })

  it('should make field indeterminate if it is indeterminate', () => {
    const fieldValues = {
      aspirate_flowRate: {
        value: '1.2',
        isIndeterminate: true,
      },
    }
    const handleChangeFormInput: any = vi.fn()

    const disabledFields = {}

    const result = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput,
      tMock
    )

    expect(result.aspirate_flowRate.isIndeterminate).toBe(true)
  })

  it('should show indeterminate tooltip content for indeterminate checkboxes', () => {
    const fieldValues = {
      preWetTip: {
        value: 'mixed',
        isIndeterminate: true,
      },
    }
    const handleChangeFormInput: any = vi.fn()

    const disabledFields = {}

    const result = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput,
      tMock
    )

    expect(result.preWetTip.isIndeterminate).toBe(true)
  })

  it('should override indeterminate tooltip content if field is also disabled', () => {
    const fieldValues = {
      preWetTip: {
        value: 'mixed',
        isIndeterminate: true,
      },
    }
    const handleChangeFormInput: any = vi.fn()

    const disabledFields = {
      preWetTip: 'Disabled explanation text here',
    }

    const result = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput,
      tMock
    )

    expect(result.preWetTip.isIndeterminate).toBe(true)
    expect(result.preWetTip.disabled).toBe(true)
    expect(result.preWetTip.tooltipContent).toBe(
      'Disabled explanation text here'
    )
  })
})
