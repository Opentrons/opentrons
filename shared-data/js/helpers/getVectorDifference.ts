import type { Coordinates } from '../types'

export function getVectorDifference(
  pointA: Coordinates,
  pointB: Coordinates
): Coordinates {
  return {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
    z: pointA.z - pointB.z,
  }
}
