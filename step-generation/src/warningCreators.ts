import type { CommandCreatorWarning } from './types'
export function aspirateMoreThanWellContents(): CommandCreatorWarning {
  return {
    type: 'ASPIRATE_MORE_THAN_WELL_CONTENTS',
    message: 'Not enough liquid',
  }
}
export function aspirateFromPristineWell(): CommandCreatorWarning {
  return {
    type: 'ASPIRATE_FROM_PRISTINE_WELL',
    message: 'This step tries to aspirate from an empty well.',
  }
}
export function labwareInWasteChuteHasLiquid(): CommandCreatorWarning {
  return {
    type: 'LABWARE_IN_WASTE_CHUTE_HAS_LIQUID',
    message: 'Disposing of a labware with liquid',
  }
}
export function tiprackInWasteChuteHasTips(): CommandCreatorWarning {
  return {
    type: 'TIPRACK_IN_WASTE_CHUTE_HAS_TIPS',
    message: 'Disposing unused tips',
  }
}

export function potentiallyUnreachableTemp(): CommandCreatorWarning {
  return {
    type: 'TEMPERATURE_IS_POTENTIALLY_UNREACHABLE',
    message: 'The module set temperature is potentially unreachable.',
  }
}
