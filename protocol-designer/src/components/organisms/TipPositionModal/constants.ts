import type { MoveLiquidPrefixType } from '../../../resources/types'

export const DECIMALS_ALLOWED = 1
export const TOO_MANY_DECIMALS: 'TOO_MANY_DECIMALS' = 'TOO_MANY_DECIMALS'
export const PERCENT_RANGE_TO_SHOW_WARNING = 0.9

export const MoveLiquidPrefixToAction: Record<MoveLiquidPrefixType, string> = {
  aspirate: 'aspirate',
  dispense: 'dispense',
  mix: 'mix',
  aspirate_retract: 'retract',
  dispense_retract: 'retract',
  aspirate_submerge: 'submerge',
  dispense_submerge: 'submerge',
}
