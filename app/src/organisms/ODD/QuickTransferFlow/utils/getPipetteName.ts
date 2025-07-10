import type { PipetteV2Specs } from '@opentrons/shared-data'

export const getPipetteName = (pipette: PipetteV2Specs): string => {
  const { model, channels } = pipette
  if (channels === 1) {
    return `${model}_single_flex`
  } else if (channels === 8) {
    return `${model}_multi_flex`
  } else {
    return `${model}_96`
  }
}
