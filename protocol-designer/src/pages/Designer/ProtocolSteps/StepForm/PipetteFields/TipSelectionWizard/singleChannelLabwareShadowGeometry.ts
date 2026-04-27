import type { LabwareDefinition2 } from '@opentrons/shared-data'

type ShadowSizing =
  /** One grid cell (center-to-center), e.g. aluminum block wells */
  | { kind: 'wellPitch'; pitchXMm: number; pitchYMm: number }
  /** Tube / well opening from definition — smaller than full rack pitch */
  | { kind: 'circularWellDiameter' }

/**
 * Single-channel shadows: labware-accurate size, centered on the hovered well,
 * instead of pipetteBoundingBoxOffsets (same for Flex and OT-2).
 *
 * Sources (shared-data labware definitions):
 * - opentrons_6_tuberack_nest_50ml_conical: use each well’s diameter (e.g. ~28 mm).
 * - opentrons_24_aluminumblock_generic_2ml_screwcap: 127.75 × 85.5 × 48.7 mm labware;
 *   D1 at (20.75, 16.88); 17.25 mm X/Y center-to-center (v1–v2).
 * - appliedbiosystemsmicroamp_384_wellplate_40ul: 127.8 × 85.5 × 9.7 mm; A1 (12.15, 76.5);
 *   4.5 mm pitch, 3.17 mm well diameter — shadow uses diameter (see Labware Library).
 *   https://labware.opentrons.com/#/?loadName=appliedbiosystemsmicroamp_384_wellplate_40ul
 */
const LABWARE_SINGLE_CHANNEL_SHADOW_BY_LOAD_NAME: Record<string, ShadowSizing> = {
  opentrons_6_tuberack_nest_50ml_conical: { kind: 'circularWellDiameter' },
  opentrons_24_aluminumblock_generic_2ml_screwcap: {
    kind: 'wellPitch',
    pitchXMm: 17.25,
    pitchYMm: 17.25,
  },
  appliedbiosystemsmicroamp_384_wellplate_40ul: { kind: 'circularWellDiameter' },
}

export function tryGetLabwareSingleChannelShadowRectMm(args: {
  labwareDef: LabwareDefinition2
  wellName: string
}): { leftMm: number; bottomMm: number; widthMm: number; heightMm: number } | null {
  const { labwareDef, wellName } = args
  const sizing = LABWARE_SINGLE_CHANNEL_SHADOW_BY_LOAD_NAME[labwareDef.parameters.loadName]
  if (sizing == null) {
    return null
  }
  const well = labwareDef.wells[wellName]
  if (well == null || well.shape !== 'circular') {
    return null
  }

  const widthMm =
    sizing.kind === 'wellPitch' ? sizing.pitchXMm : well.diameter
  const heightMm =
    sizing.kind === 'wellPitch' ? sizing.pitchYMm : well.diameter

  return {
    leftMm: well.x - widthMm / 2,
    bottomMm: well.y - heightMm / 2,
    widthMm,
    heightMm,
  }
}
