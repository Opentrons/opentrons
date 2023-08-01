export const UPDATE_MANIFEST_URLS_RELEASE = {
  ot2: 'https://builds.opentrons.com/ot2-br/releases.json',
  flex: 'https://builds.opentrons.com/ot3-oe/releases.json',
}

export const UPDATE_MANIFEST_URLS_INTERNAL_RELEASE = {
  ot2: 'https://ot3-development.builds.opentrons.com/ot2-br/releases.json',
  flex: 'https://ot3-development.builds.opentrons.com/ot3-oe/releases.json',
}

export const UPDATE_MANIFEST_URLS = (): string =>
  _OPENTRONS_PROJECT_.includes('robot-stack')
    ? UPDATE_MANIFEST_URLS_RELEASE.ot2
    : UPDATE_MANIFEST_URLS_INTERNAL_RELEASE.flex
