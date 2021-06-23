import assert from 'assert'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../../constants'
import { StepFieldName, getIsTouchTipField } from '../../../../form-types'
// TODO: Ian + Brian 2019-02-13 this should switch on stepType, not use field
// name to infer step type!
//
// TODO(IL, 2021-03-10): after resolving #7470, use this util instead
// of directly using these constants, wherever these constants are used. See also #7469
export function getDefaultMmFromBottom(args: {
  name: StepFieldName
  wellDepthMm: number
}): number {
  const { name, wellDepthMm } = args

  switch (name) {
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
        getIsTouchTipField(name),
        `getDefaultMmFromBottom fn does not know what to do with field ${name}`
      )
      return DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP + wellDepthMm
  }
}
