import { uuid } from '../../utils'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { FlexStackerModuleState } from '@opentrons/step-generation'
import type { DeckSlot } from '../../types'

export interface CreateModuleAction {
  type: 'CREATE_MODULE'
  payload: {
    slot: DeckSlot
    type: ModuleType
    model: ModuleModel
    // model should match name of module definition,
    id: string
  }
}
export const createModule = (
  args: Omit<CreateModuleAction['payload'], 'id'>
): CreateModuleAction => ({
  type: 'CREATE_MODULE',
  payload: { ...args, id: `${uuid()}:${args.type}` },
})
export interface DeleteModuleAction {
  type: 'DELETE_MODULE'
  payload: {
    id: string
  }
}
export interface UpdateStackerModuleStateAction {
  type: 'UPDATE_STACKER_MODULE_STATE'
  payload: {
    moduleId: string
    moduleState: FlexStackerModuleState
  }
}
export const updateStackerModuleState = (
  args: UpdateStackerModuleStateAction['payload']
): UpdateStackerModuleStateAction => ({
  type: 'UPDATE_STACKER_MODULE_STATE',
  payload: args,
})
