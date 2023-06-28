import { AffineTransformMatrix } from '@opentrons/shared-data'

export const IDENTITY_AFFINE_TRANSFORM: AffineTransformMatrix = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

// multiply two matrices together (dot product)
export function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const transposedB = b[0].map((_val, index) => b.map(row => row[index]))
  return a.map(rowA =>
    transposedB.map(rowB =>
      rowA.reduce((acc, valA, colIndexA) => acc + valA * rowB[colIndexA], 0)
    )
  )
}
