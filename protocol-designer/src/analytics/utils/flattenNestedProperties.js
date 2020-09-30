// @flow
import isPlainObject from 'lodash/isPlainObject'

const SEPARATOR = '__'

const _innerFnFlattenNested = (innerProperties: any, prefix: string) => {
  return Object.keys(innerProperties).reduce((acc, key) => {
    // if the key's value is an object, recurse into it
    const nestedValue = innerProperties[key]
    if (isPlainObject(nestedValue)) {
      return {
        ...acc,
        ..._innerFnFlattenNested(nestedValue, `${prefix}${SEPARATOR}${key}`),
      }
    }

    // ignore non-nested (aka top-level) keys: if no prefix, we're on the top level
    // of the original object.
    if (prefix === '') {
      return acc
    } else {
      return {
        ...acc,
        [`${prefix}${SEPARATOR}${key}`]: nestedValue,
      }
    }
  }, {})
}

// Mixpanel isn't as easy to query if you have nested properties.
// Instead of hard-coding how to transform each nested field to flat ones,
// this util does {a: {b: 1, c: 'ccc'}, d: 123, e: [1,2,3]} => {__a__b: 1, __a__c: 'ccc'}.
// Note that non-nested properties are omitted from the result.
// Also, the separator will not be escaped, so if you have a field already named '__foo__a'
// and also have a {foo: {a: 123}}, they'll clash.
export const flattenNestedProperties = (properties: any): any =>
  _innerFnFlattenNested(properties, '')
