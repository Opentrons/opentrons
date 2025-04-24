import { uuid } from '../../utils'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
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
