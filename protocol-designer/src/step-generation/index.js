// @flow
import consolidate from './consolidate'
import pickUpTip from './pickUpTip'

export * from './types'

// ===== UTILITIES ===== (TODO LATER: factor out)

// TODO Ian 2018-02-09 is there a better flow-friendly way to copy an object?
export const assign = <T>(a: T, ...b: $Shape<T>[]): T => Object.assign({}, a, ...b)

export {
  consolidate,
  pickUpTip
}
