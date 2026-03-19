export type ValueMasker = (value: unknown) => unknown
export type ValueCaster<HydratedValueT, CastValueT> = (
  value: HydratedValueT
) => CastValueT

/*********************
 **  Value Casters   **
 **********************/
// Mask to number now allows for 0 and negative numbers, for decimals use maskToFloat
export const maskToInteger = (rawValue: unknown): string => {
  const rawNumericValue =
    typeof rawValue === 'string'
      ? rawValue.replace(/[^-0-9]/g, '')
      : String(rawValue)
  return rawNumericValue
}
export const maskToPositiveInteger = (rawValue: unknown): string => {
  const rawNumericValue =
    typeof rawValue === 'string'
      ? rawValue.replace(/\D/g, '')
      : String(rawValue)
  return rawNumericValue
}
export const maskToTime = (rawValue: unknown): string => {
  if (rawValue == null) {
    return ''
  }
  const rawTimeValue =
    typeof rawValue === 'string'
      ? rawValue.replace(/[^-0-9:]/g, '')
      : String(rawValue)
  return rawTimeValue
}
/**
 * Masks input as MM:SS, building up from the right as the user types.
 * Digits are right-aligned and padded with leading zeros.
 * e.g. '' -> '', '3' -> '00:03', '34' -> '00:34', '342' -> '03:42', '3421' -> '34:21'
 */
export const maskToTimeWithPlaceholders = (
  rawValue: unknown,
  mode: 'mmss' | 'hhmmss' = 'mmss'
): string => {
  if (rawValue == null || rawValue === '') {
    return ''
  }

  const value = typeof rawValue === 'string' ? rawValue : String(rawValue)
  const digits = value.replace(/\D/g, '').slice(-(mode === 'mmss' ? 4 : 6))
  if (digits.length === 0) {
    return ''
  }

  const padded = digits.padStart(4, '0')
  return `${padded.slice(0, 2)}:${padded.slice(2)}`
}
export const maskToSignedDecimal = (rawValue: unknown): string => {
  if (rawValue == null || rawValue === '') {
    return ''
  }
  const value = typeof rawValue === 'string' ? rawValue : String(rawValue)
  const sanitized = value.replace(/[^\d.-]/g, '').replace(/(?!^)-/g, '')
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`
  }
  return sanitized
}
const DEFAULT_DECIMAL_PLACES: number = 1
export const maskToFloat = (rawValue: unknown): string =>
  typeof rawValue === 'string'
    ? rawValue.replace(/[^-/.0-9]/g, '')
    : String(rawValue)
export const trimDecimals =
  (decimals: number = DEFAULT_DECIMAL_PLACES): ValueCaster<unknown, string> =>
  (rawValue: unknown): string => {
    const trimRegex = new RegExp(`(\\d*[.]{1}\\d{${decimals}})(\\d*)`)
    return String(rawValue).replace(trimRegex, (match, group1) => group1)
  }
// if it's null, keep it null. Otherwise, try to cast to number
export const numberOrNull = (rawValue: unknown): number | null => {
  if (rawValue === null) {
    return null
  } else {
    return Number(rawValue)
  }
}
/*********************
 **  Value Limiters  **
 **********************/
// NOTE: these are often preceded by a Value Caster when composed via composeMaskers
// in practice they will always take parameters of one type (e.g. `(value: string)`)
// For the sake of simplicity and TS happiness, they are equipped to deal with parameters of type `unknown`
export const onlyPositiveNumbers: ValueMasker = (value: unknown) =>
  value !== null && !Number.isNaN(value) && Number(value) >= 0 ? value : ''
export const defaultTo =
  (defaultValue: unknown): ValueMasker =>
  (value: unknown) =>
    value === null || Number.isNaN(value) ? defaultValue : value

/*******************
 **     Helpers    **
 ********************/
type ComposeMaskers = (...maskers: ValueMasker[]) => (value: unknown) => unknown
export const composeMaskers: ComposeMaskers =
  (...maskers: ValueMasker[]) =>
  value =>
    maskers.reduce((maskingValue, masker) => masker(maskingValue), value)
