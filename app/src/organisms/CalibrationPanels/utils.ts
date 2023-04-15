import { format } from 'date-fns'
import type { Axis } from '../../molecules/JogControls/types'
import type { VectorTuple } from '../../redux/sessions/types'

const ORDERED_AXES: [Axis, Axis, Axis] = ['x', 'y', 'z']

/**
 * Returns a vector tuple representing the step along the given axis and direction.
 * e.g. reformat from ['x', -1, 0.1] to [-0.1, 0, 0]
 *
 * @param {string} axis - The axis along which to move the jog.
 * @param {number} direction - The direction of the jog, where 1 is forward and -1 is backward.
 * @param {number} step - The step size of the jog.
 * @returns {VectorTuple} The vector tuple representing the jog movement.
 */
export function formatJogVector(
  axis: string,
  direction: number,
  step: number
): VectorTuple {
  const vector: VectorTuple = [0, 0, 0]
  const index = ORDERED_AXES.findIndex(a => a === axis)
  if (index >= 0) {
    vector[index] = step * direction
  }
  return vector
}

/**
 * Formats the last modified timestamp into a string in the format "MMMM dd, yyyy HH:mm".
 * @param {string | null} lastModified - The last modified timestamp to format.
 * @returns {string} The formatted timestamp string, or "unknown" if lastModified is null or not a string.
 */
export function formatLastModified(lastModified: string | null): string {
  return typeof lastModified === 'string'
    ? format(new Date(lastModified), 'MMMM dd, yyyy HH:mm')
    : 'unknown'
}
