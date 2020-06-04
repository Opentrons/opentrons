// @flow
export const makeMaskToDecimal: (
  maxDecimals: number
) => (prevValue: string, update: string) => string = maxDecimals => (
  prevValue,
  update
) => {
  const pattern = new RegExp(`^[0-9]*\\.?[0-9]{0,${maxDecimals}}$`)
  return update.match(pattern) ? update : prevValue
}

export const maskToInteger = (prevValue: string, update: string): string =>
  update.match(/^[0-9]*$/) ? update : prevValue

export const maskLoadName = (prevValue: string, update: string): string => {
  const lowercaseUpdate = update.toLowerCase()
  return lowercaseUpdate.match(/^[a-z0-9._]*$/) ? lowercaseUpdate : prevValue
}
