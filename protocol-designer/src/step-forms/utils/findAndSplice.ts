interface FindAndSpliceArgs<T> {
  source: T[]
  elementToRemove: T
  elementsToInsert: T[]
  /** null will reinsert wherever `elementToRemove` was removed. */
  elementToInsertAfter: T | null
}

interface FindAndSpliceResult<T> {
  /**
   * `false` if `elementToRemove` or `elementToInsertAfter` couldn't be found.
   * In that case, the source array will be returned unchanged.
   */
  success: boolean
  result: T[]
}

/**
 * Remove an element from an array, and insert new elements at a designated location.
 */
export function findAndSplice<T>(
  args: FindAndSpliceArgs<T>
): FindAndSpliceResult<T> {
  const { source, elementToRemove, elementsToInsert, elementToInsertAfter } =
    args

  const indexToRemove = source.findIndex(element => element === elementToRemove)
  if (indexToRemove === -1) {
    return { success: false, result: source }
  }

  const withRemoved = source.toSpliced(indexToRemove, 1)

  const indexToInsertAt =
    elementToInsertAfter == null
      ? indexToRemove
      : withRemoved.findIndex(element => element === elementToInsertAfter) + 1
  if (indexToInsertAt === -1) {
    return { success: false, result: source }
  }

  const withReinserted = withRemoved.toSpliced(
    indexToInsertAt,
    0,
    ...elementsToInsert
  )
  return { success: true, result: withReinserted }
}
