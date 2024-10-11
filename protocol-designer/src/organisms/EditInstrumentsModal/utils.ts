import type {
  PipetteName,
  PipetteV2Specs,
  PipetteMount,
} from '@opentrons/shared-data'
import type {
  Gen,
  PipetteType,
} from '../../pages/CreateNewProtocolWizard/types'
import type { PipetteOnDeck } from '../../step-forms'

export interface PipetteSections {
  type: PipetteType
  gen: Gen | 'flex'
  volume: string
}

export const getSectionsFromPipetteName = (
  pipetteName: PipetteName,
  specs: PipetteV2Specs
): PipetteSections => {
  const channels = specs.channels
  let type: PipetteType = 'multi'
  if (channels === 96) {
    type = '96'
  } else if (channels === 1) {
    type = 'single'
  }
  const volume = pipetteName.split('_')[0]
  return {
    type,
    gen: specs.displayCategory === 'FLEX' ? 'flex' : specs.displayCategory,
    volume,
  }
}

export const getShouldShowPipetteType = (
  type: PipetteType,
  has96Channel: boolean,
  leftPipette?: PipetteOnDeck | null,
  rightPipette?: PipetteOnDeck | null,
  currentEditingMount?: PipetteMount | null
): boolean => {
  if (type === '96') {
    // if a protocol has 96-Channel, no 96-Channel button
    if (has96Channel) {
      return false
    }

    // If no mount is being edited (adding a new pipette)
    if (currentEditingMount == null) {
      // Only show if both mounts are empty
      return leftPipette == null && rightPipette == null
    }

    // Only show if the opposite mount of the one being edited is empty
    return currentEditingMount === 'left'
      ? rightPipette == null
      : leftPipette == null
  }

  // Always show 1-Channel and Multi-Channel options
  return true
}
