// @flow
import round from 'lodash/round'

const VOLUME_SIG_DIGITS_DEFAULT = 1

export function formatVolume (inputVolume: ?string | ?number, sigDigits?: number = VOLUME_SIG_DIGITS_DEFAULT): string {
  if (typeof inputVolume === 'number') {
    // don't add digits to numbers with nothing to the right of the decimal
    const digits = inputVolume.toString().split('.')[1] ? sigDigits : 0
    return String(round(inputVolume, digits))
  }
  return inputVolume || ''
}

export const formatPercentage = (part: number, total: number): string => {
  return `${round(Number((part / total) * 100), 1)}%`
}
