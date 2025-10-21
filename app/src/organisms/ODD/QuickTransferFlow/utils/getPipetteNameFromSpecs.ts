import type { PipetteV2Specs } from '@opentrons/shared-data'

export const getPipetteNameFromSpecs = (
  pipetteSpecs: PipetteV2Specs
): string => {
  const { model, channels, displayCategory } = pipetteSpecs

  const channelSuffix =
    channels === 1
      ? 'single'
      : channels === 8
        ? 'multi'
        : channels === 96
          ? '96'
          : 'single'

  // Note(kk:2025-09-05): This is used for Flex only
  const robotSuffix = displayCategory === 'FLEX' && 'flex'

  return `${model}_${channelSuffix}_${robotSuffix}`
}
