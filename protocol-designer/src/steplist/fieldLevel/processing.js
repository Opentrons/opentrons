// @flow

export type valueProcessor= (value: mixed) => ?mixed

/*********************
**  Value Casters   **
**********************/

// TODO: account for floats and negative numbers
export const castToNumber = (rawValue: mixed): ?number => {
  if (!rawValue) return null // TODO: default to zero?
  let castValue = Number(rawValue)
  if (Number.isNaN(castValue)) {
    const cleanValue = String(rawValue).replace(/[\D]+/g, '')
    return Number(cleanValue)
  } else {
    return castValue
  }
}

/*********************
**  Value Limiters  **
**********************/
// NOTE: these are often preceded by a Value Caster when composed via composeProcessors
// in practive they will always take parameters of one type (e.g. `(value: number)`)
// For the sake of simplicity and flow happiness, they are prepared to deal with values of type `mixed`

export const onlyPositiveNumbers = (value: mixed) => (value && Number(value) > 0) ? value : null
export const onlyIntegers = (value: mixed) => (value && Number.isInteger(value)) ? value : null
export const defaultTo = (defaultValue: mixed) => (value: mixed) => (value || defaultValue)

/*******************
**     Helpers    **
********************/

export const composeProcessors = (...processors: Array<valueProcessor>) => (value: mixed) => (
  processors.reduce((processingValue, processor) => processor(processingValue), value)
)
