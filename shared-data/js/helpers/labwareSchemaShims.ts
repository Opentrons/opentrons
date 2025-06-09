/** Compatibility shims to ease transitioning between with labware schemas 2 and 3. */

import type { LabwareDefinition, LabwareDefinition2 } from '../types'

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
