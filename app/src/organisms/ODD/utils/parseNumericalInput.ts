export type ParseNumericalInputResult =
  | { result: 'success'; data: number }
  | { result: 'empty' }
  | { result: 'syntaxError' }
  | { result: 'rangeError'; min: number; max: number }

export type ParseNumericalInputOptions = {
  allowDecimal: boolean
  allowNegative: boolean
} &
  // To simplify error message i18n, min+max must currently be supplied together,
  // if they are supplied at all.
  (
    | { min: number; max: number }
    | { min?: null | undefined; max?: null | undefined }
  )

export function parseNumericalInput(
  value: string,
  options: ParseNumericalInputOptions
): ParseNumericalInputResult {
  const { allowNegative, allowDecimal, min, max } = options

  if (value === '') {
    return { result: 'empty' }
  }

  // Validate it through a regex first to disallow weird stuff like "1e10".

  // -12.34
  // ^       sign (optional)
  //  ^^     int part (optional to allow input like ".5")
  //    ^^^  fractional part (optional) including the "." character
  const pattern = /^(?<sign>-)?(?<int>[0-9]+)?(?<frac>\.[0-9]+)?$/
  const match = value.match(pattern)
  const signPart: string | undefined = match?.groups?.sign
  const intPart: string | undefined = match?.groups?.int
  const fracPart: string | undefined = match?.groups?.frac

  if (!allowNegative && signPart != null) {
    return { result: 'syntaxError' }
  }

  if (!allowDecimal && fracPart != null) {
    return { result: 'syntaxError' }
  }

  if (intPart == null && fracPart == null) {
    // Allow "5" (no fractional part) and ".5" (no int part)
    // but disallow something like "-" (neither part).
    return { result: 'syntaxError' }
  }

  const data = Number(value)

  if (!Number.isFinite(data)) {
    return { result: 'syntaxError' }
  }

  if (min != null && max != null && (data < min || data > max)) {
    return { result: 'rangeError', min, max }
  }

  return { result: 'success', data }
}
