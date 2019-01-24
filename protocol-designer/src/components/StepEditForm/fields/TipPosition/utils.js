// @flow
import assert from 'assert'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../constants'

import {getIsTouchTipField, type TipOffsetFields} from '../../../form-types'

export function getDefaultMmFromBottom (args: {
  fieldName: TipOffsetFields,
  wellHeightMM: number,
}): number {
  const {fieldName, wellHeightMM} = args
  switch (fieldName) {
    case 'aspirate_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_ASPIRATE
    case 'dispense_mmFromBottom':
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE
    case 'mix_mmFromBottom':
      // TODO: Ian 2018-11-131 figure out what offset makes most sense for mix
      return DEFAULT_MM_FROM_BOTTOM_DISPENSE
    default:
      // touch tip fields
      assert(
        getIsTouchTipField(fieldName),
        `getDefaultMmFromBottom fn does not know what to do with field ${fieldName}`)
      return DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP + wellHeightMM
  }
}
