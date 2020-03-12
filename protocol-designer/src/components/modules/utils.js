// @flow

import { MODULES_WITH_COLLISION_ISSUES } from '../../constants'
import type { ModuleModel } from '@opentrons/shared-data'

export function isModuleWithCollisionIssue(model: ModuleModel): boolean {
  return MODULES_WITH_COLLISION_ISSUES.includes(model)
}
