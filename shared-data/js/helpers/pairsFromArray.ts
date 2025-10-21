import initial from 'lodash/initial'

/**
 * Return all pairs of consecutive elements.
 *
 * [1, 2, 3, 4] -> [[1, 2], [2, 3], [3, 4]]
 * [1] -> []
 * [] -> []
 */
export function pairsFromArray<T>(array: T[]): Array<[T, T]> {
  const firstElements = initial(array)
  const pairs = firstElements.map<[T, T]>((firstElement, firstIndex) => {
    const secondElement = array[firstIndex + 1]
    return [firstElement, secondElement]
  })
  return pairs
}
