/** Types to operate on types. */

/**
 * Returns the keys that are mentioned by *any* element of a union.
 *
 * Constrast this with TypeScript's native `keyof UnionT`, which only returns the keys
 * that are mentioned in *every* element of the union.
 *
 * @example
 * type Food =
 *   | { type: 'pizza', topping: 'shrooms' | 'pineapple' }
 *   | { type: 'taco', topping: 'guac' | 'lime' }
 *   | { type: 'dumpling', filling: 'meat' | 'veg' }
 * type T = AllKeysOfUnion<Food>
 * // T = 'type' | 'topping' | 'filling'
 * // `keyof Food` would only return 'type'.
 */
// The `extends any` condition always returns true, so this always takes the `keyof UnionT` branch.
// We need the condition because, as a side effect, it runs `keyof` on each element of the union
// instead of on the union as a whole. See "distributive conditional types" in the TypeScript docs.
export type AllKeysOfUnion<UnionT> = UnionT extends any ? keyof UnionT : never

/**
 * Given a key that appears in some elements of a union,
 * return a union of all the possible value types for that key.
 *
 * @example
 * type Food =
 *   | { type: 'pizza', topping: 'shrooms' | 'pineapple' }
 *   | { type: 'taco', topping: 'guac' | 'lime' }
 *   | { type: 'dumpling', filling: 'meat' | 'veg' }
 * type T = DistributivePick<'topping', Food>
 * // T = 'shrooms' | 'pineapple' | 'guac' | 'lime'
 */
export type PickValuesFromUnion<
  UnionT,
  KeyT extends string | number | symbol,
> = UnionT extends {
  [Key in KeyT]?: unknown
}
  ? UnionT[KeyT]
  : never

/**
 * Combines a union of objects into a single object.
 *
 * It's easiest to explain what this means through an example:
 *
 * @example
 * type Food =
 *   | { type: 'pizza', topping: 'shrooms' | 'pineapple' }
 *   | { type: 'taco', topping: 'guac' | 'lime' }
 *   | { type: 'dumpling', filling: 'meat' | 'veg' }
 * type T = SmooshUnion<Food>
 * // T = {
 * //   type: 'pizza' | 'taco' | 'dumpling'
 * //   topping: 'shrooms' | 'pineapple' | 'guac' | 'lime'
 * //   filling: 'meat' | 'veg'
 * // }
 */
export type AmalgamateUnion<UnionT> = {
  [Key in AllKeysOfUnion<UnionT>]: PickValuesFromUnion<UnionT, Key>
}
