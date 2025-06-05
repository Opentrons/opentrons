import {
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
  POSITION_REFERENCE_TOP,
} from '..'

import type { PositionReference } from '../types'

export const getMmFromBottom = (
  zValue: number,
  reference: PositionReference,
  wellDepth: number | null
): number | null => {
  if (wellDepth == null) {
    return null
  }
  switch (reference) {
    case POSITION_REFERENCE_BOTTOM:
      return zValue
    case POSITION_REFERENCE_CENTER:
      return wellDepth / 2 + zValue
    case POSITION_REFERENCE_TOP:
      return wellDepth + zValue
  }
  return null
}
