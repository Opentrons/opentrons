// @flow
const globalMemoCache: { string: number } = {}

export const globallyMemoizedFibb = (r: number): number => {
  if (globalMemoCache[r] !== undefined) {
    return globalMemoCache[r]
  }

  let result = 1
  let prev = 0
  for (let i = 0; i < r; i++) {
    const lastResult = result
    result = result + prev
    prev = lastResult
  }
  globalMemoCache[r] = result
  return result
}

export const makeMemoizedFibb: () => (r: number) => number = () => {
  const _memoCache: { string: number } = {}

  const _fibb = (r: number): number => {
    if (_memoCache[r] !== undefined) {
      return _memoCache[r]
    }

    let result = 1
    let prev = 0
    for (let i = 0; i < r; i++) {
      const lastResult = result
      result = result + prev
      prev = lastResult
    }
    _memoCache[r] = result
    return result
  }
  return _fibb
}
