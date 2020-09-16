// @flow

// Skip all pairs for which `excludeWhen` returns true
export function removePairs<T>(
  input: Array<T>,
  excludeWhen: (T, T) => boolean
): Array<T> {
  const WIDTH = 2
  let currentPos = 0
  const res: Array<T> = []
  while (currentPos + 1 < input.length) {
    console.log({ currentPos })
    const firstVal = input[currentPos]
    const secondVal = input[currentPos + 1]
    if (excludeWhen(firstVal, secondVal)) {
      // we do not want to include these values, skip ahead by 2
      currentPos += WIDTH
      console.log({ res })
      continue
    } else {
      res.push(firstVal)
      currentPos += 1
      console.log({ res })
    }
  }

  if (currentPos + 1 === input.length) {
    res.push(input[currentPos])
  }
  return res
}
