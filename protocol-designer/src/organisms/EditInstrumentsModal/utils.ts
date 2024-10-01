import type { PipetteName, PipetteV2Specs } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteType,
} from '../../pages/CreateNewProtocolWizard/types'

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
