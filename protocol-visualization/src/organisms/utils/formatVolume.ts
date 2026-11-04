import round from 'lodash/round'

const VOLUME_SIG_DIGITS_DEFAULT = 2
export const formatVolume = (
  inputVolume?: string | number | null,
  sigDigits: number = VOLUME_SIG_DIGITS_DEFAULT
): string => {
  if (typeof inputVolume === 'number') {
    const digits = inputVolume.toString().includes('.') ? sigDigits : 0
    return String(round(inputVolume, digits))
  }
  return inputVolume ?? ''
}
