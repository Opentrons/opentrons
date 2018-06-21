// @flow

export type valueProcessor= (value: mixed) => ?mixed

/*********************
**  Value Casters   **
**********************/

// TODO: account for floats and negative numbers
export const castToNumber = (rawValue: mixed): ?number => {
  if (!rawValue) return null // TODO: default to zero?
  const cleanValue = String(rawValue).replace(/[\D]+/g, '')
  return Number(cleanValue)
}
export const castToBoolean = (rawValue: mixed): boolean => !!rawValue

/*********************
**  Value Limiters  **
**********************/

export const onlyPositiveNumbers = (value: mixed) => (value && Number(value) > 0) ? value : null
export const onlyIntegers = (value: mixed) => (value && Number.isInteger(value)) ? value : null
export const defaultTo = (defaultValue: mixed) => (value: mixed) => (value || defaultValue)

// const minutesToSeconds = (seconds) => Number(seconds) * 60 // TODO: this shouldn't be a form field processor but a save formatter

/*******************
**     Helpers    **
********************/

export const composeProcessors = (...processors: Array<valueProcessor>) => (value: mixed) => (
  processors.reduce((processingValue, processor) => processor(processingValue), value)
)
