// @flow
import { getWellRatio } from '../../../../steplist/utils'

import type { PathOption, StepType } from '../../../../form-types'
import type { ChangeTipOptions } from '../../../../step-generation/types'

export type DisabledChangeTipArgs = {|
  aspirateWells?: Array<string>,
  dispenseWells?: Array<string>,
  stepType?: StepType,
  path?: ?PathOption,
|}

export const getDisabledChangeTipOptions = (
  args: DisabledChangeTipArgs
): ?Set<ChangeTipOptions> => {
  const { path, aspirateWells, dispenseWells, stepType } = args
  switch (stepType) {
    case 'moveLiquid': {
      const wellRatio = getWellRatio(aspirateWells, dispenseWells)
      // form with no wells selected treated as 'single'
      if (!wellRatio || !path || path === 'single') {
        if (wellRatio === '1:many') {
          return new Set(['perSource'])
        }
        return new Set(['perDest'])
      }
      // path is multi
      return new Set(['perSource', 'perDest'])
    }
    case 'mix': {
      return new Set(['perSource', 'perDest'])
    }
    default: {
      console.warn(
        `getChangeTipOptions for stepType ${String(
          stepType
        )} not yet implemented!`
      )
      return null
    }
  }
}
