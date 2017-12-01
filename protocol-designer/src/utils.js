export const humanize = s =>
  s.toLowerCase().split(/-|_|\./)
    .filter(s => s) // only truthy
    .map(substring =>
      substring[0].toUpperCase() + substring.slice(1)
    ).join(' ')

// Not really a UUID, but close enough...?
export const uuid = () => new Date().getTime() + '.' + Math.random()

export const intToAlphabetLetter = (i, lowerCase = false) =>
  String.fromCharCode((lowerCase ? 96 : 65) + i)


export const transpose = matrix => matrix[0].map((_col, i) =>
  matrix.map(row => row[i])
)

// These utils are great candidates for unit tests
export const toWellName = ({rowNum, colNum}) => (
  String.fromCharCode(colNum + 65) + (rowNum + 1)
)

export const wellKeyToXYList = wellKey => {
  const [x, y] = wellKey.split(',').map(s => parseInt(s, 10))
  return toWellName({rowNum: parseInt(y), colNum: x})
}
