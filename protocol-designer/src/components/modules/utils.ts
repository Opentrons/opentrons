import { MODULES_WITH_COLLISION_ISSUES } from '@opentrons/step-generation'
import { ModuleModel } from '@opentrons/shared-data'
export function isModuleWithCollisionIssue(model: ModuleModel): boolean {
  // @ts-expect-error(sa, 2021-6-21): ModuleModel is a super type of the elements in MODULES_WITH_COLLISION_ISSUES
  return MODULES_WITH_COLLISION_ISSUES.includes(model)
}
