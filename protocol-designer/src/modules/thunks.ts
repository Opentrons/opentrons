import { selectors as stepFormSelectors } from '../step-forms'
import { uuid } from '../utils'
import { getNextAvailableModuleSlot } from './moduleData'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { CreateModuleAction } from '../step-forms/actions'
import type { ThunkAction } from '../types'

interface CreateModuleWithNoSloArgs {
  type: ModuleType
  model: ModuleModel
}
export const createModuleWithNoSlot: (
  args: CreateModuleWithNoSloArgs
) => ThunkAction<CreateModuleAction> = args => (dispatch, getState) => {
  const { model, type } = args
  const state = getState()
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  const slot = getNextAvailableModuleSlot(initialDeckSetup)

  if (slot == null) {
    console.assert(slot, 'expected to find available slot but could not')
  }

  dispatch({
    type: 'CREATE_MODULE',
    payload: {
      model,
      type,
      slot: slot ?? '',
      id: `${uuid()}:${type}}`,
    },
  })
}
