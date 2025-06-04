import type { CoordinateTuple, Vector3D } from '../types'

/**
 * Add an arbitrary number of vectors.
 * e.g. `getVectorSum(a, b, c)` is a + b + c.
 */
export function getVectorSum(first: Vector3D, ...rest: Vector3D[]): Vector3D {
  return rest.reduce(
    (prev, current) => ({
      x: prev.x + current.x,
      y: prev.y + current.y,
      z: prev.z + current.z,
    }),
    first
  )
}

/**
 * Subtract an arbitrary number of vectors.
 * e.g. `getVectorDifference(a, b, c)` is a - b - c.
 */
export function getVectorDifference(
  first: Vector3D,
  ...rest: Vector3D[]
): Vector3D {
  return rest.reduce(
    (prev, current) => ({
      x: prev.x - current.x,
      y: prev.y - current.y,
      z: prev.z - current.z,
    }),
    first
  )
}

export function getVectorInverse(vector: Vector3D): Vector3D {
  return {
    x: -vector.x,
    y: -vector.y,
    z: -vector.z,
  }
}

export function coordinateTupleToVector3D(
  coordinateTuple: CoordinateTuple
): Vector3D {
  const [x, y, z] = coordinateTuple
  return { x, y, z }
}
