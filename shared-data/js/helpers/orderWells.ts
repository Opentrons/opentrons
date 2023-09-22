import zipWith from 'lodash/zipWith'
import uniq from 'lodash/uniq'
import compact from 'lodash/compact'
import flatten from 'lodash/flatten'

type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t'

// labware definitions in shared-data have an ordering
// attribute which is an Array of Arrays of wells. Each inner
// Array represents a physical column of wells on the labware
// this function takes that 2d Array of columns and returns
// the same wells in a 2d Array where each inner Array represents
// a physical row of wells on the labware.
// e.g.
// [                      \       [
//   ['A1', 'B1'],     === \        ['A1', 'A2']
//   ['A2', 'B2']      === /        ['B1', 'B2']
// ]                      /       ]
//
const _orderingColsToRows = (ordering: string[][]): string[][] =>
  zipWith(...ordering, (...col) => compact(uniq(col)))

// given a default "ordering" 2d array from labware definitions
// where each inner array represents a physical column of wells
// and well order option selections (e.g. 'l2r', 'r2l', 't2b', 'b2t')
// this function returns a 1d array of wells from the labware
// ordered by the given traversal technique
export const orderWells = (
  defaultOrdering: string[][],
  first: WellOrderOption,
  second: WellOrderOption
): string[] => {
  let orderedWells: string[][] = []

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
      orderedWells = defaultOrdering
        .slice()
        .reverse()
        .map(col => col.slice().reverse())
    }
  } else if (first === 'l2r') {
    if (second === 't2b') {
      orderedWells = _orderingColsToRows(defaultOrdering)
    } else if (second === 'b2t') {
      orderedWells = _orderingColsToRows(defaultOrdering).slice().reverse()
    }
  } else if (first === 'r2l') {
    if (second === 't2b') {
      orderedWells = _orderingColsToRows(defaultOrdering).map(col =>
        col.slice().reverse()
      )
    } else if (second === 'b2t') {
      orderedWells = _orderingColsToRows(defaultOrdering)
        .slice()
        .reverse()
        .map(col => col.slice().reverse())
    }
  }
  return flatten(orderedWells)
}
