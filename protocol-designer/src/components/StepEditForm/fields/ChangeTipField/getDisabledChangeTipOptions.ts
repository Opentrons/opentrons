import { getWellRatio } from '../../../../steplist/utils'
import { PathOption, StepType } from '../../../../form-types'
import { ChangeTipOptions } from '@opentrons/step-generation'
export interface DisabledChangeTipArgs {
  aspirateWells?: string[]
  dispenseWells?: string[]
  stepType?: StepType
  path?: PathOption | null | undefined
}
export const getDisabledChangeTipOptions = (
  args: DisabledChangeTipArgs
): Set<ChangeTipOptions> | null | undefined => {
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
