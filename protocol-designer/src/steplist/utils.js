// @flow
import zipWith from 'lodash/zipWith'
import uniq from 'lodash/uniq'
import compact from 'lodash/compact'
import flatten from 'lodash/flatten'

/** Merge 2 adjacent elements of an array when predicate fn is true */
export function mergeWhen<T> (
  array: Array<T>,
  predicate: (current: T, next: T) => mixed,
  merge: (current: T, next: T) => T
): Array<T> {
  if (array.length <= 1) {
    return array
  }

  const result = []
  let canMerge = true

  for (let i = 0; i + 1 < array.length; i++) {
    let current = array[i]
    let next = array[i + 1]

    if (canMerge) {
      if (predicate(current, next)) {
        result.push(merge(current, next))
        canMerge = false
      } else {
        result.push(current)
      }
    } else {
      canMerge = true
    }
  }

  if (canMerge) {
    result.push(array[array.length - 1])
  }

  return result
}

// labware definitions in shared-data have an ordering
// attribute which is an Array of Arrays of wells. Each inner
// Array represents a vertical column of wells on the labware
// this function takes that 2d Array of columns and returns
// the same wells in a 2d Array where each inner Array represents
// a horizontal row of wells on the labware.
// e.g.
// [                      \       [
//   ['A1', 'B1'],     === \        ['A1', 'A2']
//   ['A2', 'B2']      === /        ['B1', 'B2']
// ]                      /       ]
//
export const orderingColsToRows = (ordering: Array<Array<string>>): Array<Array<string>> => (
  zipWith(...ordering, (...col) => (compact(uniq(col))))
)

// given a default ordering 2d array from labware definitions
// and well order option selections (e.g. 'l2r', 'r2l', 't2b', 'b2t')
// this function returns a 1d array of wells from the labware
// ordered by the given traversal technique
export const orderWells = (defaultOrdering: Array<Array<string>>, first: WellOrderOption, second: WellOrderOption) => {
  let orderedWells = []
  if (first === 't2b') {
    if (second === 'l2r') {
      orderedWells = defaultOrdering
    } else if (second === 'r2l') {
      orderedWells = defaultOrdering.slice().reverse()
    }
  } else if (first === 'b2t') {
    if (second === 'l2r') {
      orderedWells = defaultOrdering.map(col => col.slice().reverse())
    } else if (second === 'r2l') {
      orderedWells = defaultOrdering.slice().reverse().map(col => col.slice().reverse())
    }
  } else if (first === 'l2r') {
    if (second === 't2b') {
      orderedWells = orderingColsToRows(defaultOrdering)
    } else if (second === 'b2t') {
      orderedWells = orderingColsToRows(defaultOrdering).slice().reverse()
    }
  } else if (first === 'r2l') {
    if (second === 't2b') {
      orderedWells = orderingColsToRows(defaultOrdering).map(col => col.slice().reverse())
    } else if (second === 'b2t') {
      orderedWells = orderingColsToRows(defaultOrdering).slice().reverse().map(col => col.slice().reverse())
    }
  }
  return flatten(orderedWells)
}
