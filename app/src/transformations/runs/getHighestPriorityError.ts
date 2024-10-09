import type { RunError } from '@opentrons/api-client'

const _getHighestPriorityError = (error: RunError): RunError => {
  if (
    error == null ||
    error.wrappedErrors == null ||
    error.wrappedErrors.length === 0
  ) {
    return error
  }

  let highestPriorityError = error

  error.wrappedErrors.forEach(wrappedError => {
    const e = _getHighestPriorityError(wrappedError)
    const isHigherPriority = _getIsHigherPriority(
      e.errorCode,
      highestPriorityError.errorCode
    )
    if (isHigherPriority) {
      highestPriorityError = e
    }
  })
  return highestPriorityError
}

/**
 * returns true if the first error code is higher priority than the second, false otherwise
 */
const _getIsHigherPriority = (
  errorCode1: string,
  errorCode2: string
): boolean => {
  const errorNumber1 = Number(errorCode1)
  const errorNumber2 = Number(errorCode2)

  const isSameCategory =
    Math.floor(errorNumber1 / 1000) === Math.floor(errorNumber2 / 1000)
  const isCode1GenericError = errorNumber1 % 1000 === 0

  let isHigherPriority = null

  if (
    (isSameCategory && !isCode1GenericError) ||
    (!isSameCategory && errorNumber1 < errorNumber2)
  ) {
    isHigherPriority = true
  } else {
    isHigherPriority = false
  }

  return isHigherPriority
}

export const getHighestPriorityError = (errors: RunError[]): RunError => {
  const highestFirstWrappedError = _getHighestPriorityError(errors[0])
  return [highestFirstWrappedError, ...errors.slice(1)].reduce((acc, val) => {
    const e = _getHighestPriorityError(val)
    const isHigherPriority = _getIsHigherPriority(e.errorCode, acc.errorCode)
    if (isHigherPriority) {
      return e
    }
    return acc
  })
}
