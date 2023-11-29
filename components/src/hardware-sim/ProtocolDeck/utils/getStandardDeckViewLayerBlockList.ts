import type { RobotType } from '@opentrons/shared-data'

const OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

const OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'DECK_BASE',
  'BARCODE_COVERS',
]

export const getStandardDeckViewLayerBlockList = (
  robotType: RobotType
): string[] => {
  switch (robotType) {
    case 'OT-2 Standard':
      return OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST
    case 'OT-3 Standard':
      return OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST
    default:
      return []
  }
}
