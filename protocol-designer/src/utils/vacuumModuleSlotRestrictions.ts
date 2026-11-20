import { VACUUM_MODULE_TYPE, VACUUM_MODULE_V1 } from '@opentrons/shared-data'

import type { CutoutId } from '@opentrons/shared-data'

const FLEX_ROWS = ['A', 'B', 'C', 'D'] as const
const STANDARD_COLUMN = '3'

export interface ModuleLocationForVacuumRestriction {
  slot: string
  cutoutId?: CutoutId | string | null
  type?: string
  model?: string
}

/**
 * Extract a Flex column-3 standard slot (A3/B3/C3/D3) from a slot, cutout,
 * or addressable area. Staging slots (A4–D4) return null — they are not a
 * gripper collision risk next to a vacuum module.
 */
export function getStandardColumn3Slot(
  slotOrCutout: string | null | undefined
): string | null {
  if (slotOrCutout == null) {
    return null
  }
  const match = /([ABCD])3/.exec(slotOrCutout)
  if (match == null) {
    return null
  }
  return `${match[1]}${STANDARD_COLUMN}`
}

/**
 * Standard slots that cannot hold a module when a vacuum module occupies
 * `vacuumModuleSlot`.
 *
 * The gripper paddles collide with the vacuum collar when they open on a
 * module in the neighboring inboard standard slot:
 * - vacuum module on A3 → no modules on B3
 * - vacuum module on D3 (future) → no modules on C3
 *
 * Staging slots are not included.
 */
export function getSlotsBlockedForModulesByVacuumModule(
  vacuumModuleSlot: string
): string[] {
  const standardSlot = getStandardColumn3Slot(vacuumModuleSlot)
  if (standardSlot == null) {
    return []
  }
  const row = standardSlot[0] as (typeof FLEX_ROWS)[number]
  const rowIndex = FLEX_ROWS.indexOf(row)
  if (rowIndex < 0) {
    return []
  }
  // Mid-deck is between B and C. Move one row toward the center.
  const neighborRowIndex = rowIndex <= 1 ? rowIndex + 1 : rowIndex - 1
  const neighborRow = FLEX_ROWS[neighborRowIndex]
  return [`${neighborRow}${STANDARD_COLUMN}`]
}

export function doesVacuumModuleBlockModuleSlot(
  vacuumModuleSlot: string,
  candidateSlot: string
): boolean {
  const candidateStandard = getStandardColumn3Slot(candidateSlot)
  if (candidateStandard == null) {
    return false
  }
  return getSlotsBlockedForModulesByVacuumModule(vacuumModuleSlot).includes(
    candidateStandard
  )
}

function getModuleLocationKey(
  module: ModuleLocationForVacuumRestriction
): string {
  // Prefer the module's slot so a stacker/mag block on a staging slot (B4)
  // is not treated as occupying the neighboring standard slot (B3).
  return module.slot
}

export function getVacuumModuleLocations(
  modules: Record<string, ModuleLocationForVacuumRestriction>
): string[] {
  return Object.values(modules)
    .filter(
      module =>
        module.type === VACUUM_MODULE_TYPE || module.model === VACUUM_MODULE_V1
    )
    .map(module => getModuleLocationKey(module))
}

export function isCutoutBlockedByExistingVacuumModule(
  cutoutId: CutoutId | string,
  modules: Record<string, ModuleLocationForVacuumRestriction>
): boolean {
  return getVacuumModuleLocations(modules).some(vacuumModuleSlot =>
    doesVacuumModuleBlockModuleSlot(vacuumModuleSlot, cutoutId)
  )
}

export function wouldVacuumModuleBlockExistingModule(
  vacuumModuleCutoutId: CutoutId | string,
  modules: Record<string, ModuleLocationForVacuumRestriction>
): boolean {
  return Object.values(modules).some(module =>
    doesVacuumModuleBlockModuleSlot(
      vacuumModuleCutoutId,
      getModuleLocationKey(module)
    )
  )
}
