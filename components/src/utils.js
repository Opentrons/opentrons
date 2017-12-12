export const humanize = s =>
  s.toLowerCase().split(/-|_|\./)
    .filter(s => s) // only truthy
    .map(substring =>
      substring[0].toUpperCase() + substring.slice(1)
    ).join(' ')

export const wellNameSplit = wellName => {
  // Eg B9 => ['B', '9']
  const raw = wellName.split(/(\D+)(\d+)/)

  if (raw.length !== 4) {
    throw Error('expected /\\D+\\d+/ regexp to split wellName, got ' + wellName)
  }

  const letters = raw[1]

  if (letters.length !== 1) {
    throw Error('expected 1 letter in wellName, got ' + letters + ' in wellName: ' + wellName)
  }

  const numbers = raw[2]

  return [letters, numbers]
}
