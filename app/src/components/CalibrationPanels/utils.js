// @flow
import { format } from 'date-fns'
import type { JogAxis } from '../../http-api-client'
import type { VectorTuple } from '../../sessions/types'

const ORDERED_AXES: [JogAxis, JogAxis, JogAxis] = ['x', 'y', 'z']

// e.g. reformat from ['x', -1, 0.1] to [-0.1, 0, 0]
export function formatJogVector(
  axis: string,
  direction: number,
  step: number
): VectorTuple {
  const vector = [0, 0, 0]
  const index = ORDERED_AXES.findIndex(a => a === axis)
  if (index >= 0) {
    vector[index] = step * direction
  }
  return vector
}

export function formatLastModified(lastModified: string | null): string {
  return typeof lastModified === 'string'
    ? format(new Date(lastModified), 'MMMM dd, yyyy HH:mm')
    : 'unknown'
}
