// @flow
export type ValueMasker = (value: mixed) => mixed
export type ValueCaster = (value: mixed) => mixed

/*********************
 **  Value Casters   **
 **********************/

// Mask to number now allows for 0 and negative numbers, for decimals use maskToFloat
export const maskToNumber = (rawValue: mixed): mixed => {
  if (!rawValue) return Number(rawValue)
  const rawNumericValue =
    typeof rawValue === 'string'
      ? rawValue.replace(/[^-0-9]/, '')
      : String(rawValue)
  return rawNumericValue
}

// rawValue.replace(/[\D]+/g, '')
const DEFAULT_DECIMAL_PLACES = 1

export const maskToFloat = (rawValue: mixed): ?mixed => {
  if (!rawValue) return Number(rawValue)
  const rawNumericValue =
    typeof rawValue === 'string'
      ? rawValue.replace(/[^-/.0-9]/, '')
      : String(rawValue)
  const trimRegex = new RegExp(
    `(\\d*[.]{1}\\d{${DEFAULT_DECIMAL_PLACES}})(\\d*)`
  )
  return rawNumericValue.replace(trimRegex, (match, group1) => group1)
}

/*********************
 **  Value Limiters  **
 **********************/
// NOTE: these are often preceded by a Value Caster when composed via composeMaskers
// in practice they will always take parameters of one type (e.g. `(value: string)`)
// For the sake of simplicity and flow happiness, they are equipped to deal with parameters of type `mixed`

export const onlyPositiveNumbers = (value: mixed) =>
  value && Number(value) >= 0 ? value : null
export const onlyIntegers = (value: mixed) =>
  value && Number.isInteger(value) ? value : null
export const defaultTo = (defaultValue: mixed) => (value: mixed) =>
  value || defaultValue

/*******************
 **     Helpers    **
 ********************/

export const composeMaskers = (...maskers: Array<ValueMasker>) => (
  value: mixed
) => maskers.reduce((maskingValue, masker) => masker(maskingValue), value)
