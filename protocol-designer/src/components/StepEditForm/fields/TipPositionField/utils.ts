import round from 'lodash/round'
import { getIsTouchTipField } from '../../../../form-types'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../../constants'
import { DECIMALS_ALLOWED, TOO_MANY_DECIMALS } from './constants'
import type { StepFieldName } from '../../../../form-types'

// TODO: Ian + Brian 2019-02-13 this should switch on stepType, not use field
// name to infer step type!
//
// TODO(IL, 2021-03-10): after resolving #7470, use this util instead
// of directly using these constants, wherever these constants are used. See also #7469
export function getDefaultMmFromBottom(args: {
  name: StepFieldName
  wellDepthMm: number
}): number {
  const { name, wellDepthMm } = args

  switch (name) {
    case 'aspirate_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_ASPIRATE

    case 'aspirate_delay_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_ASPIRATE

    case 'dispense_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE

    case 'dispense_delay_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE

    case 'mix_mmFromBottom':
      // TODO: Ian 2018-11-131 figure out what offset makes most sense for mix
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE

    default:
      // touch tip fields
      console.assert(
        getIsTouchTipField(name),
        `getDefaultMmFromBottom fn does not know what to do with field ${name}`
      )
      return DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP + wellDepthMm
  }
}

export const roundValue = (value: number | string | null): number => {
  return value === null ? 0 : round(Number(value), DECIMALS_ALLOWED)
}

const OUT_OF_BOUNDS: 'OUT_OF_BOUNDS' = 'OUT_OF_BOUNDS'
export type Error = typeof TOO_MANY_DECIMALS | typeof OUT_OF_BOUNDS

export const getErrorText = (args: {
  errors: Error[]
  maxMm: number
  minMm: number
  isPristine: boolean
  t: any
}): string | null => {
  const { errors, minMm, maxMm, isPristine, t } = args

  if (errors.includes(TOO_MANY_DECIMALS)) {
    return t('tip_position.errors.TOO_MANY_DECIMALS')
  } else if (!isPristine && errors.includes(OUT_OF_BOUNDS)) {
    return t('tip_position.errors.OUT_OF_BOUNDS', {
      minMm,
      maxMm,
    })
  } else {
    return null
  }
}

export const getErrors = (args: {
  isDefault: boolean
  value: string | null
  maxMm: number
  minMm: number
}): Error[] => {
  const { isDefault, value: rawValue, maxMm, minMm } = args
  const errors: Error[] = []
  if (isDefault) return errors

  const value = Number(rawValue)
  if (rawValue === null || Number.isNaN(value)) {
    // blank or otherwise invalid should show this error as a fallback
    return [OUT_OF_BOUNDS]
  }
  const incorrectDecimals = round(value, DECIMALS_ALLOWED) !== value
  const outOfBounds = value > maxMm || value < minMm

  if (incorrectDecimals) {
    errors.push(TOO_MANY_DECIMALS)
  }
  if (outOfBounds) {
    errors.push(OUT_OF_BOUNDS)
  }
  return errors
}

interface MinMaxValues {
  minValue: number
  maxValue: number
}

export const getMinMaxWidth = (width: number): MinMaxValues => {
  return {
    minValue: -width * 0.5,
    maxValue: width * 0.5,
  }
}
