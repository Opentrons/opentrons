import type { NumericalInputOptions } from '../types'

export const isValidNumericalInput = (
  value: string,
  options: NumericalInputOptions = {}
): boolean => {
  if (options.allowDecimal === true && options.allowNegative === true) {
    return /^-?\d*\.?\d*$/.test(value)
  }
  if (options.allowDecimal === true) {
    return /^\d*\.?\d*$/.test(value)
  }
  if (options.allowNegative === true) {
    return /^-?\d*$/.test(value)
  }
  return /^\d*$/.test(value)
}
