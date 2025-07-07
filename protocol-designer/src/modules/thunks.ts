import { getModuleEntities } from '../step-forms/selectors'
import { getModulePythonName } from '../utils'

import type { ModuleEntity } from '@opentrons/step-generation'
import type { ModuleEntities } from '../step-forms'
import type { DeleteModuleAction } from '../step-forms/actions'
import type { ThunkAction } from '../types'

export interface EditMultipleModulesAction {
  type: 'EDIT_MULTIPLE_MODULES_PYTHON_NAME'
  payload: ModuleEntities
}

interface DeleteModuleArgs {
  moduleId: string
}
export const deleteModule: (
  args: DeleteModuleArgs
) => ThunkAction<DeleteModuleAction | EditMultipleModulesAction> = args => (
  dispatch,
  getState
) => {
  const { moduleId } = args
  const state = getState()
  const moduleEntities = getModuleEntities(state)
  const moduleType = moduleEntities[moduleId].type
  const modulesOfSameType: ModuleEntities = Object.fromEntries(
    Object.entries(moduleEntities).filter(
      ([_, module]) => module.type === moduleType
    )
  )
  const typeCount = Object.keys(modulesOfSameType).length

  dispatch({
    type: 'DELETE_MODULE',
    payload: {
      id: moduleId,
    },
  })

  if (typeCount > 1) {
    const { [moduleId]: _, ...remainingModuleEntities } = modulesOfSameType

    const updatedModulePythonName: ModuleEntities = Object.keys(
      remainingModuleEntities
    )
      .sort()
      .reduce<Record<string, ModuleEntity>>((acc, oldId, index) => {
        acc[oldId] = {
          ...remainingModuleEntities[oldId],
          pythonName: getModulePythonName(moduleType, index + 1),
        }
        return acc
      }, {})

    dispatch({
      type: 'EDIT_MULTIPLE_MODULES_PYTHON_NAME',
      payload: updatedModulePythonName,
    })
  }
}
