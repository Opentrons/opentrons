import type { Vector3D } from '../types'

export function getVectorSum(pointA: Vector3D, pointB: Vector3D): Vector3D {
  return {
    x: pointA.x + pointB.x,
    y: pointA.y + pointB.y,
    z: pointA.z + pointB.z,
  }
}

export function getVectorDifference(
  pointA: Vector3D,
  pointB: Vector3D
): Vector3D {
  return {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
    z: pointA.z - pointB.z,
  }
}

export function getVectorInverse(vector: Vector3D): Vector3D {
  return {
    x: -vector.x,
    y: -vector.y,
    z: -vector.z,
  }
}
