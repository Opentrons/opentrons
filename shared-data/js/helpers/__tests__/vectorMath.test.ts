import { describe, expect, it } from 'vitest'

import {
  getVectorDifference,
  getVectorInverse,
  getVectorSum,
} from '../vectorMath'

describe('getVectorSum', () => {
  it(`should calculate sum betwen pointA and pointB with integer values`, () => {
    expect(
      getVectorSum({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })
    ).toStrictEqual({
      x: 2,
      y: 4,
      z: 6,
    })
  })
  it(`should calculate sum betwen pointA and pointB with decimal values`, () => {
    expect(
      getVectorSum({ x: 1.0, y: 2.0, z: 3.0 }, { x: 1.0, y: 2.0, z: 3.0 })
    ).toStrictEqual({ x: 2, y: 4, z: 6 })
  })
  it(`should calculate sum betwen pointA and pointB with mix of negative and positive`, () => {
    expect(
      getVectorSum({ x: -1.0, y: -2.0, z: -3.0 }, { x: 1.0, y: 2.0, z: 3.0 })
    ).toStrictEqual({ x: 0, y: 0, z: 0 })
  })
  it('should handle summing three vectors', () => {
    expect(
      getVectorSum(
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 },
        { x: 7, y: 8, z: 9 }
      )
    ).toStrictEqual({ x: 12, y: 15, z: 18 })
  })
  it('should handle summing four vectors with mix of negative and positive', () => {
    expect(
      getVectorSum(
        { x: 1, y: -2, z: 3 },
        { x: -4, y: 5, z: -6 },
        { x: 7, y: -8, z: 9 },
        { x: -10, y: 11, z: -12 }
      )
    ).toStrictEqual({ x: -6, y: 6, z: -6 })
  })
})

describe('getVectorDifference', () => {
  it(`should calculate difference betwen pointA and pointB with integer values`, () => {
    expect(
      getVectorDifference({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })
    ).toStrictEqual({ x: 0, y: 0, z: 0 })
  })
  it(`should calculate difference betwen pointA and pointB with decimal values`, () => {
    expect(
      getVectorDifference(
        { x: 1.0, y: 2.0, z: 3.0 },
        { x: 1.0, y: 2.0, z: 3.0 }
      )
    ).toStrictEqual({ x: 0, y: 0, z: 0 })
  })
  it(`should calculate difference betwen pointA and pointB with mix of negative and positive`, () => {
    expect(
      getVectorDifference(
        { x: -1.0, y: -2.0, z: -3.0 },
        { x: 1.0, y: 2.0, z: 3.0 }
      )
    ).toStrictEqual({ x: -2, y: -4, z: -6 })
  })
  it('should handle subtracting three vectors', () => {
    expect(
      getVectorDifference(
        { x: 10, y: 10, z: 10 },
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 }
      )
    ).toStrictEqual({ x: 5, y: 3, z: 1 })
  })
  it('should handle subtracting four vectors with mix of negative and positive', () => {
    expect(
      getVectorDifference(
        { x: 20, y: 20, z: 20 },
        { x: 1, y: -2, z: 3 },
        { x: -4, y: 5, z: -6 },
        { x: 7, y: -8, z: 9 }
      )
    ).toStrictEqual({ x: 16, y: 25, z: 14 })
  })
})

describe('getVectorInverse', () => {
  it('should negate each component', () => {
    expect(getVectorInverse({ x: 1.23, y: 0, z: -1.23 })).toStrictEqual({
      x: -1.23,
      y: -0,
      z: 1.23,
    })
  })
})
