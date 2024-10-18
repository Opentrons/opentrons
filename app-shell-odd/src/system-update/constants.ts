const OPENTRONS_PROJECT: string = _OPENTRONS_PROJECT_

export const FLEX_MANIFEST_URL =
  OPENTRONS_PROJECT && OPENTRONS_PROJECT.includes('robot-stack')
    ? 'https://builds.opentrons.com/ot3-oe/releases.json'
    : 'https://ot3-development.builds.opentrons.com/ot3-oe/releases.json'

export const SYSTEM_UPDATE_DIRECTORY = '__ot_system_update__'
export const VERSION_FILENAME = 'VERSION.json'
export const REASONABLE_VERSION_FILE_SIZE_B = 4096
export const SYSTEM_FILENAME = 'system-update.zip'
