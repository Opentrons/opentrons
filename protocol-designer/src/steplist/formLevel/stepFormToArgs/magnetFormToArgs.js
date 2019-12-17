// @flow
import assert from 'assert'
import type { HydratedMagnetFormData } from '../../../form-types'
import type {
  EngageMagnetArgs,
  DisengageMagnetArgs,
} from '../../../step-generation'

type MagnetArgs = EngageMagnetArgs | DisengageMagnetArgs

export const magnetFormToArgs = (
  hydratedFormData: HydratedMagnetFormData
): MagnetArgs => {
  const { magnetAction, moduleId, engageHeight } = hydratedFormData

  assert(
    magnetAction === 'engage' ? engageHeight != null : true,
    'magnetFormToArgs expected (hydrated) engageHeight to be non-null if magnetAction is "engage"'
  )
  if (magnetAction === 'engage' && engageHeight != null) {
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
