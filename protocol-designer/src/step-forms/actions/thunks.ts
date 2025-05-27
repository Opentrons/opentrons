import { createContainer } from '../../labware-ingred/actions'
import { changeSavedStepForm } from '../../steplist/actions'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { uuid } from '../../utils'

import type {
  DeckSlotId,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import type { FormData } from '../../form-types'
import type {
  CreateContainerAction,
  RenameLabwareAction,
  ZoomedIntoSlotAction,
} from '../../labware-ingred/actions'
import type { ChangeSavedStepFormAction } from '../../steplist/actions'
import type { ThunkAction } from '../../types'
import type { CreateModuleAction } from './modules'

export interface CreateContainerAboveModuleArgs {
  slot: DeckSlotId
  labwareDefURIStack: string[]
}

export const createContainerAboveModule: (
  args: CreateContainerAboveModuleArgs
) => ThunkAction<
  CreateContainerAction | RenameLabwareAction | ZoomedIntoSlotAction
> = args => (dispatch, getState) => {
  const { slot, labwareDefURIStack } = args
  const state = getState()
  const deckSetup = getDeckSetupForActiveItem(state)
  const modules = deckSetup.modules

  const moduleId = Object.values(modules).find(module => module.slot === slot)
    ?.id
  dispatch(
    createContainer({
      slot: moduleId,
      labwareDefURIStack,
    })
  )
}

interface ModuleAndChangeFormArgs {
  slot: DeckSlotId
  type: ModuleType
  model: ModuleModel
  moduleSteps: FormData[]
  pauseSteps: FormData[]
}
export const createModuleEntityAndChangeForm: (
  args: ModuleAndChangeFormArgs
) => ThunkAction<CreateModuleAction | ChangeSavedStepFormAction> = args => (
  dispatch,
  getState
) => {
  const { slot, model, type, moduleSteps, pauseSteps } = args
  const moduleId = `${uuid()}:${type}`

  dispatch({
    type: 'CREATE_MODULE',
    payload: { slot, model, type, id: moduleId },
  })

  //  if steps are created with the module that has been regenerated, migrate them to use the correct moduleId
  moduleSteps.forEach(step => {
    dispatch(
      changeSavedStepForm({
        stepId: step.id,
        update: {
          moduleId,
        },
      })
    )
  })
  pauseSteps.forEach(step => {
    dispatch(
      changeSavedStepForm({
        stepId: step.id,
        update: {
          moduleId,
        },
      })
    )
  })
}
