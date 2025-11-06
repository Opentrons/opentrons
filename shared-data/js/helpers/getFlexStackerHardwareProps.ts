import { FLEX_STACKER_MODULE_V1 } from '../constants'
import { getModuleDef } from '../modules'

import type { ModuleModel } from '../types'

export const getModuleMaxFillHeight = (model: ModuleModel): number => {
  if (model === FLEX_STACKER_MODULE_V1) {
    return (
      getModuleDef(FLEX_STACKER_MODULE_V1).dimensions.maxStackerFillHeight ?? 0
    )
  }
  throw new Error(`Invalid module model for max fill height: ${model}`)
}

// export const getModuleMaxRetrievableHeight = (model: ModuleModel): number =>
//   getModuleDef(model).dimensions.maxStackerRetrievableHeight ?? 0
