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
    const firstVal = input[currentPos]
    const secondVal = input[currentPos + 1]
    if (excludeWhen(firstVal, secondVal)) {
      // we do not want to include these values, skip ahead by 2
      currentPos += WIDTH
      continue
    } else {
      res.push(firstVal)
      currentPos += 1
    }
  }

  // make sure we account for the last item if we exited the while loop
  // before we got to it
  if (currentPos + 1 === input.length) {
    res.push(input[currentPos])
  }
  return res
}
