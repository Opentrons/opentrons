// @flow

import type { ModuleModel } from '@opentrons/shared-data'
import { MODULES_WITH_COLLISION_ISSUES } from '../../constants'

export function isModuleWithCollisionIssue(model: ModuleModel): boolean {
  return MODULES_WITH_COLLISION_ISSUES.includes(model)
}
