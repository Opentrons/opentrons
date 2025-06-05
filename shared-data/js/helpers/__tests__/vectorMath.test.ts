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
})
