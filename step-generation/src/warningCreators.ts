import type { CommandCreatorWarning } from './types'
export function aspirateMoreThanWellContents(): CommandCreatorWarning {
  return {
    type: 'ASPIRATE_MORE_THAN_WELL_CONTENTS',
    message: 'Not enough liquid in well(s)',
  }
}
export function aspirateFromPristineWell(): CommandCreatorWarning {
  return {
    type: 'ASPIRATE_FROM_PRISTINE_WELL',
    message:
      'Aspirating from a pristine well. No liquids were ever added to this well',
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
    message: 'Disposing of a tiprack with tips',
  }
}
