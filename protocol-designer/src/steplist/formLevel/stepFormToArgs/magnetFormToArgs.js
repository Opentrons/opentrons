// @flow
import assert from 'assert'

import type { HydratedMagnetFormData } from '../../../form-types'
import type {
  DisengageMagnetArgs,
  EngageMagnetArgs,
} from '../../../step-generation'

type MagnetArgs = EngageMagnetArgs | DisengageMagnetArgs

export const magnetFormToArgs = (
  hydratedFormData: HydratedMagnetFormData
): MagnetArgs => {
  const { magnetAction, moduleId } = hydratedFormData
  const engageHeight = parseFloat(hydratedFormData.engageHeight)

  assert(
    magnetAction === 'engage' ? !Number.isNaN(engageHeight) : true,
    'magnetFormToArgs expected (hydrated) engageHeight to be non-NaN if magnetAction is "engage"'
  )
  if (magnetAction === 'engage' && !Number.isNaN(engageHeight)) {
    return {
      commandCreatorFnName: 'engageMagnet',
      module: moduleId,
      engageHeight,
    }
  } else {
    return {
      commandCreatorFnName: 'disengageMagnet',
      module: moduleId,
    }
  }
}
