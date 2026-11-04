/** Allow optional leading `-` only, then digits with at most one `.`. */
export const sanitizeGaugePressureInput = (raw: string): string => {
  let out = ''
  let i = 0
  if (raw[0] === '-') {
    out = '-'
    i = 1
  }
  let seenDecimal = false
  for (; i < raw.length; i++) {
    const c = raw[i]
    if (c >= '0' && c <= '9') {
      out += c
    } else if (c === '.' && !seenDecimal) {
      seenDecimal = true
      out += c
    }
  }
  return out
}
