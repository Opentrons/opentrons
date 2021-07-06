import round from 'lodash/round'
const VOLUME_SIG_DIGITS_DEFAULT = 2
export function formatVolume(
  inputVolume?: string | number | null,
  sigDigits: number = VOLUME_SIG_DIGITS_DEFAULT
): string {
  if (typeof inputVolume === 'number') {
    // don't add digits to numbers with nothing to the right of the decimal
    const digits = inputVolume.toString().split('.')[1] ? sigDigits : 0
    return String(round(inputVolume, digits))
  }

  return inputVolume || ''
}
const PERCENTAGE_DECIMALS_ALLOWED = 1
export const formatPercentage = (part: number, total: number): string => {
  return `${round((part / total) * 100, PERCENTAGE_DECIMALS_ALLOWED)}%`
}
