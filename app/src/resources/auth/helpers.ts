export const USERNAME_MAX_LENGTH = 20
export const MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH = 256

export function isValidPasswordComplexityMinimumLength(value: string): boolean {
  const parsedValue = Number(value)
  return (
    Number.isInteger(parsedValue) &&
    parsedValue > 0 &&
    parsedValue <= MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH
  )
}
