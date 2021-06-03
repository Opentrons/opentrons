// @flow
export type ValueMasker = (value: mixed) => mixed
export type ValueCaster = (value: mixed) => mixed

/*********************
 **  Value Casters   **
 **********************/

// Mask to number now allows for 0 and negative numbers, for decimals use maskToFloat
export const maskToInteger = (rawValue: mixed): string => {
  const rawNumericValue =
    typeof rawValue === 'string'
      ? rawValue.replace(/[^-0-9]/g, '')
      : String(rawValue)
  return rawNumericValue
}

const DEFAULT_DECIMAL_PLACES: number = 1

export const maskToFloat = (rawValue: mixed): string =>
  typeof rawValue === 'string'
    ? rawValue.replace(/[^-/.0-9]/g, '')
    : String(rawValue)

export const trimDecimals = (
  decimals: number = DEFAULT_DECIMAL_PLACES
): ValueCaster => (rawValue: mixed): string => {
  const trimRegex = new RegExp(`(\\d*[.]{1}\\d{${decimals}})(\\d*)`)
  return String(rawValue).replace(trimRegex, (match, group1) => group1)
}

/*********************
 **  Value Limiters  **
 **********************/
// NOTE: these are often preceded by a Value Caster when composed via composeMaskers
// in practice they will always take parameters of one type (e.g. `(value: string)`)
// For the sake of simplicity and flow happiness, they are equipped to deal with parameters of type `mixed`

export const onlyPositiveNumbers: ValueMasker = (value: mixed) =>
  value !== null && !Number.isNaN(value) && Number(value) >= 0 ? value : ''
export const defaultTo = (defaultValue: mixed): ValueMasker => (value: mixed) =>
  value === null || Number.isNaN(value) ? defaultValue : value

/*******************
 **     Helpers    **
 ********************/

type ComposeMaskers = (
  ...maskers: Array<ValueMasker>
) => (value: mixed) => mixed
export const composeMaskers: ComposeMaskers = (
  ...maskers: Array<ValueMasker>
) => value =>
  maskers.reduce((maskingValue, masker) => masker(maskingValue), value)
