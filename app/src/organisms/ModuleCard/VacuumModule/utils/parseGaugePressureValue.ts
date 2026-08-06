export const parseGaugePressureValue = (input: string): number => {
  if (input === '' || input === '-' || input === '.' || input === '-.') {
    return 0
  }
  return Number(input)
}
