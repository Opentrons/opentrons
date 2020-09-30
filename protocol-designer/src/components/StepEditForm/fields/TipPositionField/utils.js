// @flow
import assert from 'assert'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../../constants'

import {
  getIsTouchTipField,
  type TipOffsetFields,
} from '../../../../form-types'

// TODO: Ian + Brian 2019-02-13 this should switch on stepType, not use field
// name to infer step type!
export function getDefaultMmFromBottom(args: {
  fieldName: TipOffsetFields,
  wellDepthMm: number,
}): number {
  const { fieldName, wellDepthMm } = args
  switch (fieldName) {
    case 'aspirate_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_ASPIRATE
    case 'aspirate_delay_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_ASPIRATE
    case 'dispense_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE
    case 'dispense_delay_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE
    case 'mix_mmFromBottom':
      // TODO: Ian 2018-11-131 figure out what offset makes most sense for mix
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE
    default:
      // touch tip fields
      assert(
        getIsTouchTipField(fieldName),
        `getDefaultMmFromBottom fn does not know what to do with field ${fieldName}`
      )
      return DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP + wellDepthMm
  }
}
