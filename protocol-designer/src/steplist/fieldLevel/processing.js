// @flow
export type ValueMasker = (value: mixed) => mixed
export type ValueCaster = (value: mixed) => mixed

/*********************
 **  Value Casters   **
 **********************/

// TODO: account for floats and negative numbers
export const maskToNumber = (rawValue: mixed): mixed => {
  if (!rawValue) return null
  let castValue = Number(rawValue)
  if (Number.isNaN(castValue)) {
    const cleanValue = String(rawValue).replace(/[\D]+/g, '')
    return cleanValue
  } else {
    return castValue
  }
}

const DEFAULT_DECIMAL_PLACES = 1
export const maskToFloat = (rawValue: mixed): ?mixed => {
  if (!rawValue) return Number(rawValue)
  const rawNumericValue =
    typeof rawValue === 'string'
      ? rawValue.replace(/[^.0-9]/, '')
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
// in practive they will always take parameters of one type (e.g. `(value: number)`)
// For the sake of simplicity and flow happiness, they are equiped to deal with parameters of type `mixed`

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
