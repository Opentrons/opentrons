// json protocol file validator tests
import { getVectorDifference } from '../getVectorDifference'

describe('getVectorDifference', () => {
  it(`should calculate difference betwen pointA and pointB with integer values`, () => {
    expect(
      getVectorDifference({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })
    ).toEqual({ x: 0, y: 0, z: 0 })
  })
  it(`should calculate difference betwen pointA and pointB with decimal values`, () => {
    expect(
      getVectorDifference(
        { x: 1.0, y: 2.0, z: 3.0 },
        { x: 1.0, y: 2.0, z: 3.0 }
      )
    ).toEqual({ x: 0, y: 0, z: 0 })
  })
})
