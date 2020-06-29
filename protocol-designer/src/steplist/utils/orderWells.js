// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import compact from 'lodash/compact'
import flatten from 'lodash/flatten'
import intersection from 'lodash/intersection'
import uniq from 'lodash/uniq'
import zipWith from 'lodash/zipWith'

import type { WellOrderOption } from '../../form-types'

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

export const _orderingColsToRows = (
  ordering: Array<Array<string>>
): Array<Array<string>> =>
  // $FlowFixMe(BC, 2018-08-27): flow-typed for lodash zipWith only supports <4 inner arrays
  zipWith(...ordering, (...col) => compact(uniq(col)))

// given a default "ordering" 2d array from labware definitions
// where each inner array represents a physical column of wells
// and well order option selections (e.g. 'l2r', 'r2l', 't2b', 'b2t')
// this function returns a 1d array of wells from the labware
// ordered by the given traversal technique
export const orderWells = (
  defaultOrdering: Array<Array<string>>,
  first: WellOrderOption,
  second: WellOrderOption
): Array<string> => {
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
      orderedWells = defaultOrdering
        .slice()
        .reverse()
        .map(col => col.slice().reverse())
    }
  } else if (first === 'l2r') {
    if (second === 't2b') {
      orderedWells = _orderingColsToRows(defaultOrdering)
    } else if (second === 'b2t') {
      orderedWells = _orderingColsToRows(defaultOrdering)
        .slice()
        .reverse()
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

export function getOrderedWells(
  unorderedWells: Array<string>,
  labwareDef: LabwareDefinition2,
  wellOrderFirst: WellOrderOption,
  wellOrderSecond: WellOrderOption
): Array<string> {
  const allWellsOrdered = orderWells(
    labwareDef.ordering,
    wellOrderFirst,
    wellOrderSecond
  )
  return intersection(allWellsOrdered, unorderedWells)
}
