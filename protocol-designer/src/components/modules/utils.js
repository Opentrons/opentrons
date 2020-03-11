// @flow

import { GEN_ONE_MODULES } from '../../constants'
import type { ModuleModel } from '@opentrons/shared-data'

export function isVersionOneModule(model: ModuleModel): boolean {
  return GEN_ONE_MODULES.includes(model)
}
