
type valueProcessor= (value: mixed) => ?mixed
// Field Processors

const composeProcessors = (...processors: Array<valueProcessor>) => (value) => (
  processors.reduce((processingValue, processor) => processor(processingValue), value)
)
const castToNumber = (rawValue) => {
  if (!rawValue) return null
  const cleanValue = String(rawValue).replace(/[\D]+/g, '')
  return Number(cleanValue)
}
const onlyPositiveNumbers = (number) => (number && Number(number) > 0) ? number : null
const onlyIntegers = (number) => (number && Number.isInteger(number)) ? number : null
// const minutesToSeconds = (seconds) => Number(seconds) * 60 // TODO: this shouldn't be a form field processor but a save formatter

const castToBoolean = (rawValue) => !!rawValue

const defaultTo = (defaultValue: mixed) => (value) => (value || defaultValue)



export const processField = (name: StepFieldName, value: mixed) => {
  const fieldProcessor = get(StepFieldHelperMap, `${name}.processValue`)
  return fieldProcessor ? fieldProcessor(value) : value
}
