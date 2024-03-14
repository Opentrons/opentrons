import { describe, it, expect } from 'vitest'
import { getVectorSum } from '../getVectorSum'

describe('getVectorSum', () => {
  it(`should calculate sum betwen pointA and pointB with integer values`, () => {
    expect(getVectorSum({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })).toEqual({
      x: 2,
      y: 4,
      z: 6,
    })
  })
  it(`should calculate sum betwen pointA and pointB with decimal values`, () => {
    expect(
      getVectorSum({ x: 1.0, y: 2.0, z: 3.0 }, { x: 1.0, y: 2.0, z: 3.0 })
    ).toEqual({ x: 2, y: 4, z: 6 })
  })
  it(`should calculate sum betwen pointA and pointB with mix of negative and positive`, () => {
    expect(
      getVectorSum({ x: -1.0, y: -2.0, z: -3.0 }, { x: 1.0, y: 2.0, z: 3.0 })
    ).toEqual({ x: 0, y: 0, z: 0 })
  })
})
