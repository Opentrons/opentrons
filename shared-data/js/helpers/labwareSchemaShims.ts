/** Compatibility shims to ease transitioning between with labware schemas 2 and 3. */

import { getVectorInverse, getVectorSum, IDENTITY_VECTOR } from './vectorMath'

import type {
  AddressableArea,
  LabwareDefinition,
  LabwareDefinition2,
  Vector3D,
} from '../types'

/** Return dimensions of the total labware bounding box in the style of labware schema 2. */
export function getSchema2Dimensions(
  definition: LabwareDefinition
): LabwareDefinition2['dimensions'] {
  if (definition.schemaVersion === 2) {
    return definition.dimensions
  } else {
    const { backLeftBottom, frontRightTop } = definition.extents.total
    const xDimension = frontRightTop.x - backLeftBottom.x
    const yDimension = backLeftBottom.y - frontRightTop.y
    const zDimension = frontRightTop.z - backLeftBottom.z
    return { xDimension, yDimension, zDimension }
  }
}

/**
 * Return a bounding box, in coordinates relative to the labware's origin,
 * that encloses the labware when viewed from the top down.
 */
export function getLabwareViewBox(
  definition: LabwareDefinition
): {
  /** The minimum x-coord, i.e. the left of the labware. */
  minX: number
  /** The minimum y-coord, i.e. the front of the labware. */
  minY: number
  xDimension: number
  yDimension: number
} {
  if (definition.schemaVersion === 2) {
    const { xDimension, yDimension } = definition.dimensions
    return {
      // In labware schema 2, the front-left is always at (0, 0) by definition.
      minX: 0,
      minY: 0,
      xDimension,
      yDimension,
    }
  } else {
    const { backLeftBottom, frontRightTop } = definition.extents.total
    const minX = backLeftBottom.x
    const maxX = frontRightTop.x
    const minY = frontRightTop.y
    const maxY = backLeftBottom.y
    return {
      minX,
      minY,
      xDimension: maxX - minX,
      yDimension: maxY - minY,
    }
  }
}

/**
 * Return the offset from a deck slot's origin (the slot's front-left, -x, -y)
 * to a labware's origin (varies depending on the labware),
 * supposing the labware is placed in that slot.
 */
export function getDeckSlotOriginToLabwareOrigin(
  // slotDefinition is currently unused by this limited implementation. A proper
  // implementation would need it, so we're requiring it now to get callers in the habit.
  slotDefinition: AddressableArea,
  labwareDefinition: LabwareDefinition
): Vector3D {
  const slotOriginToSlotFrontLeft = IDENTITY_VECTOR

  if (labwareDefinition.schemaVersion === 2) {
    // For schema 2 labware, the labware origin is always its front-left-bottom (-x, -y, -z),
    // and it's positioned with that corner in reference to the front-left (-x, -y) of the
    // slot, plus an adjustment supplied by the labware (cornerOffsetFromSlot).
    const slotFrontLeftToLabwareFrontLeftBottom =
      labwareDefinition.cornerOffsetFromSlot
    const labwareFrontLeftBottomToLabwareOrigin = IDENTITY_VECTOR
    return getVectorSum(
      slotOriginToSlotFrontLeft,
      slotFrontLeftToLabwareFrontLeftBottom,
      labwareFrontLeftBottomToLabwareOrigin
    )
  } else {
    // For schema 3 labware, the labware origin can be at an arbitrary point in the labware.
    // Also, how the labware is positioned relative to its parent varies depending on the context.
    // Here, we're accounting for the variance in labware origin, but simplifying the positioning,
    // for now, to always put the front-left-bottom (-x, -y, -z) of the labware at the front-left of
    // the slot. This is good enough for current display purposes and matches the schema 2 behavior.
    const slotFrontLeftToLabwareFrontLeftBottom = IDENTITY_VECTOR
    const labwareOriginToLabwareFrontLeftBottom = {
      x: labwareDefinition.features.slotFootprintAsChild?.backLeft.x ?? 0,
      y: labwareDefinition.features.slotFootprintAsChild?.frontRight.y ?? 0,
      z: labwareDefinition.features.slotFootprintAsChild?.z ?? 0,
    }
    const labwareFrontLeftBottomToLabwareOrigin = getVectorInverse(
      labwareOriginToLabwareFrontLeftBottom
    )
    return getVectorSum(
      slotOriginToSlotFrontLeft,
      slotFrontLeftToLabwareFrontLeftBottom,
      labwareFrontLeftBottomToLabwareOrigin
    )
  }
}

/**
 * Return the offset from a labware's back-left-bottom (-x, +y, -z) corner to its origin.
 *
 * This is a lower-level helper for the rare cases where we want to position a labware
 * specifically by its back-left corner. Typically, you'll want something higher-level,
 * like `getLabwareViewBox()` or `getDeckSlotOriginToLabwareOrigin()`, instead.
 */
export function getLabwareBackLeftBottomToOrigin(
  definition: LabwareDefinition
): Vector3D {
  if (definition.schemaVersion === 2) {
    return {
      x: 0,
      y: -definition.dimensions.yDimension,
      z: 0,
    }
  } else {
    const originToBackLeftBottom = definition.extents.total.backLeftBottom
    const backLeftBottomToOrigin = getVectorInverse(originToBackLeftBottom)
    return backLeftBottomToOrigin
  }
}

/**
 * Return a definition's cornerOffsetFromSlot in the style of labware schema 2.
 *
 * @deprecated This is probably an inherently wrong interface to attempt, for a couple
 * reasons.
 *
 * FIRST, depending on what the call site does with this, it might expect the return
 * value to be either:
 *
 * - The vector from the (-x, -y) corner of the parent slot to the (-x, -y) corner of
 *   the labware
 * - The vector from the (-x, -y) corner of the parent slot to the origin of the
 *   labware
 *
 * In labware schema 2, these were the same thing, but not in schema 3.
 *
 * SECOND, in labware schema 2, how a child labware sits on its parent is almost
 * entirely a function of the child's definition. In labware schema 3, it is
 * much more dependent on information only available in the parent. For example, to
 * line up a child's well A1 with a parent's well A1, we need to know where the
 * parent's well A1 is. (Schema 2 just did not attempt to support that).
 *
 * For schema-2 definitions, this will return cornerOffsetFromSlot as-is.
 *
 * For schema-3 definitions, this currently returns the placeholder (12, 34, 56), which
 * is certainly wrong and will cause all manner of visual mayhem, but at least it's
 * wrong in an obvious way and it unblocks importing schema-3 definitions. Solving this
 * properly is call-site-dependent, as described above.
 */
export function getSchema2CornerOffsetFromSlot(
  definition: LabwareDefinition
): LabwareDefinition2['cornerOffsetFromSlot'] {
  if (definition.schemaVersion === 2) {
    return definition.cornerOffsetFromSlot
  } else {
    console.warn(
      `getSchema2CornerOffsetFromSlot() called on schema-3 labware ${definition.parameters.loadName}.` +
        ` Returning bogus data. The labware will render in the wrong place.`
    )
    return {
      x: 12,
      y: 34,
      z: 56,
    }
  }
}
