import type { PipetteV2Specs } from '@opentrons/shared-data'

export const getPipetteNameFromSpecs = (
  pipetteSpecs: PipetteV2Specs
): string => {
  const { model, channels, displayCategory } = pipetteSpecs

  const getChannelSuffix = (): string => {
    if (channels === 1) {
      return 'single'
    }
    if (channels === 8) {
      return 'multi'
    }
    if (channels === 96) {
      return '96'
    }
    return 'single'
  }
  const channelSuffix = getChannelSuffix()

  // Note(kk:2025-09-05): This is used for Flex only
  const robotSuffix = displayCategory === 'FLEX' && 'flex'

  return `${model}_${channelSuffix}_${robotSuffix}`
}
