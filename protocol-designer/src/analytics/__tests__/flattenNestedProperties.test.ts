// @flow
import { flattenNestedProperties } from '../utils/flattenNestedProperties'

describe('flattenNestedProperties', () => {
  it('should flatten shallow nested properties', () => {
    const result = flattenNestedProperties({ a: { b: 'blah' } })
    expect(result).toEqual({ __a__b: 'blah' })
  })

  it('should flatten deep nested properties', () => {
    const result = flattenNestedProperties({
      outer: { inner: { innermost: { x: 123 } } },
    })

    expect(result).toEqual({ __outer__inner__innermost__x: 123 })
  })

  it('should handle arrays', () => {
    const result = flattenNestedProperties({
      arr: [1, 2, 3],
      x: { y: 'foo', innerArr: [11, 22, 33] },
    })
    expect(result).toEqual({ __x__y: 'foo', __x__innerArr: [11, 22, 33] })
  })

  it('should exclude non-nested properties', () => {
    const result = flattenNestedProperties({ a: 123, arr: [1, 2, 3] })
    expect(result).toEqual({})
  })

  it('should handle getting empty object', () => {
    const result = flattenNestedProperties({})
    expect(result).toEqual({})
  })

  it('should work with several levels of nesting in the input', () => {
    const result = flattenNestedProperties({
      apple: {
        seeds: true,
        color: 'red',
        alternatives: { color: 'green', seeds: false },
      },
      banana: {
        seeds: false,
        color: 'yellow',
      },
      foo: 'blah',
    })
    expect(result).toEqual({
      __apple__seeds: true,
      __apple__color: 'red',
      __apple__alternatives__color: 'green',
      __apple__alternatives__seeds: false,
      __banana__seeds: false,
      __banana__color: 'yellow',
    })
  })
})
