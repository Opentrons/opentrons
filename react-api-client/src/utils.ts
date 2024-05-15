import mapValues from 'lodash/mapValues'

/**
 * Replace undefined values of an object with null values for use in useQuery query key argument
 * @example
 * getSanizedQueryKeyObject({key1: 'value1', key2: null, key3: undefined}):
 * {key1: 'value1', key2: null, key3: null}
 *
 * @param {Object | null} obj - object to replace undefined values
 *
 * @returns {Object | null} Returns value-updated object
 */
export function getSanitizedQueryKeyObject(obj: Object | null): Object | null {
  return obj != null
    ? mapValues(obj, (v: any) => (v !== undefined ? v : null))
    : null
}
