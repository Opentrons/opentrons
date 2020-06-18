// @flow
import {
  CHECK_TRANSFORM_TYPE_DECK,
  CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
  type CHECK_TRANSFORM_TYPE,
} from '../../calibration'
import type { JogAxis } from '../../http-api-client'

const BAD = 'Bad'
const DETECTED = 'detected'

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

export function getBadOutcomeHeader(transform: CHECK_TRANSFORM_TYPE): string {
  let outcome = ''
  switch (transform) {
    case CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET:
      outcome = 'pipette offset calibration data'
      break
    case CHECK_TRANSFORM_TYPE_DECK:
      outcome = 'deck calibration data'
      break
    case CHECK_TRANSFORM_TYPE_UNKNOWN:
      outcome = 'deck calibration data or pipette offset calibration data'
      break
  }
  return `${BAD} ${outcome} ${DETECTED}`
}
