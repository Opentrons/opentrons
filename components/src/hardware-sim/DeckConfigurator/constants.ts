export const FIXTURE_HEIGHT = 106.0
export const SINGLE_SLOT_FIXTURE_WIDTH = 246.5
export const STAGING_AREA_FIXTURE_WIDTH = 318.5
export const STAGING_AREA_DISPLAY_NAME = 'Staging area'
export const TRASH_BIN_DISPLAY_NAME = 'Trash bin'
export const WASTE_CHUTE_DISPLAY_NAME = 'Waste chute'

export const wasteChuteDef = {
  schemaVersion: 1,
  version: 1,
  namespace: 'opentrons',
  metadata: {
    displayName: 'Waste chute',
  },
  parameters: {
    loadName: 'trash_chute',
  },
  boundingBox: {
    xDimension: 286.5,
    yDimension: FIXTURE_HEIGHT,
    zDimension: 0,
  },
}
