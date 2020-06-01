// @flow
import type { JogAxis } from '../../http-api-client'

const ORDERED_AXES: [JogAxis, JogAxis, JogAxis] = ['x', 'y', 'z']

// e.g. reformat from ['x', -1, 0.1] to [-0.1, 0, 0]
export function formatJogVector(
  axis: string,
  direction: number,
  step: number
): [number, number, number] {
  const vector = [0, 0, 0]
  const index = ORDERED_AXES.findIndex(a => a === axis)
  if (index >= 0) {
    vector[index] = step * direction
  }
  return vector
}

export function formatOffsetValue(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100
  return parseFloat(rounded).toFixed(2)
}
