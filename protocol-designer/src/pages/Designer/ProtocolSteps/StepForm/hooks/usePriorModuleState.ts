import { useSelector } from 'react-redux'

import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import type { ModuleState } from '@opentrons/step-generation'

/**
 * Return the state of the given module at the point in time just before the
 * current step (the step whose form is open).
 */
export function usePriorModuleState<ModuleType extends ModuleState['type']>(
  moduleId: string | null,
  expectedModuleType: ModuleType
): (ModuleState & { type: ModuleType }) | null {
  // fixme(mm, 2025-09-19): getRobotStateAtActiveItem returns the state for the hovered step,
  // which isn't quite what we want. We want the state just before the step that owns this form.
  const state = useSelector(getRobotStateAtActiveItem)

  if (moduleId == null) {
    // This can happen if the user hasn't selected a module yet.
    return null
  }

  const moduleState = state?.modules[moduleId]?.moduleState

  if (moduleState == null) {
    // This can happen if the user deletes the module but retains this step.
    return null
  }

  if (isModuleOfType(moduleState, expectedModuleType)) {
    return moduleState
  } else {
    console.error(
      `Expected ${expectedModuleType} but got ${moduleState.type}. This is a bug in the step form.`
    )
    return null
  }
}

function isModuleOfType<T extends ModuleState['type']>(
  moduleState: ModuleState,
  expectedType: T
): moduleState is ModuleState & { type: T } {
  return moduleState.type === expectedType
}
