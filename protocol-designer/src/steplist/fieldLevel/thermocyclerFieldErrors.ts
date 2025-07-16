import type { HydratedFormData } from '../../form-types'

export type ErrorChecker = (
  value: unknown,
  hydratedFormData?: HydratedFormData
) => string | null

//  TODO: audit these errors.the thermocycler form works a bit differently since there is the thermocycler
//  modal. i guess these fields are for that? otherwise, these should probably be deprecated?
export const isTimeFormatMinutesSeconds: ErrorChecker = (
  value: unknown
): string | null => {
  const timeRegex = /^(?:[0-9]?\d):(?:[0-5]\d|[0-9])$/g
  return (typeof value === 'string' && timeRegex.test(value)) || !value
    ? null
    : 'Must be a valid time (mm:ss)'
}
export const minFieldValue = (minimum: number): ErrorChecker => (
  value: unknown
): string | null =>
  !value || Number(value) >= minimum ? null : `Min is ${minimum}`
export const maxFieldValue = (maximum: number): ErrorChecker => (
  value: unknown
): string | null =>
  !value || Number(value) <= maximum ? null : `Max is ${maximum}`

export const enterValueWithinRange = (
  minimum: number,
  maximum: number
): ErrorChecker => (value: unknown): string | null =>
  !value || (Number(value) <= maximum && Number(value) >= minimum)
    ? null
    : 'Enter a value within the specified range'
