import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { createContainer } from '../../labware-ingred/actions'
import { changeSavedStepForm } from '../../steplist/actions'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { uuid } from '../../utils'
import { updateStackerModuleState } from './modules'

import type {
  DeckSlotId,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import type { FormData } from '../../form-types'
import type {
  CreateContainerAction,
  OpenIngredientSelectorAction,
  RenameLabwareAction,
  ZoomedIntoSlotAction,
} from '../../labware-ingred/actions'
import type { ChangeSavedStepFormAction } from '../../steplist/actions'
import type { ThunkAction } from '../../types'
import type {
  CreateModuleAction,
  UpdateStackerModuleStateAction,
} from './modules'

export interface CreateContainerAboveModuleArgs {
  slot: DeckSlotId
  labwareDefURIGroup: {
    adapterDefURI: string | null
    topLabwareDefURI: string | null
    lidDefURI: string | null
  }
  stackerInfo?:
    | {
        stackerPosition: 'shuttle'
      }
    | {
        stackerPosition: 'hopper'
        amount: number
      }
}

export const createContainerAboveModule: (
  args: CreateContainerAboveModuleArgs
) => ThunkAction<
  | CreateContainerAction
  | RenameLabwareAction
  | ZoomedIntoSlotAction
  | OpenIngredientSelectorAction
  | UpdateStackerModuleStateAction
> = args => (dispatch, getState) => {
  const { slot, labwareDefURIGroup, stackerInfo } = args
  const state = getState()
  const deckSetup = getDeckSetupForActiveItem(state)
  const modules = deckSetup.modules

  const module = Object.values(modules).find(module => module.slot === slot)
  if (module == null) {
    return
  }
  const { id: moduleId, type: moduleType } = module
  const { adapterDefURI, topLabwareDefURI, lidDefURI } = labwareDefURIGroup
  const labwareDefURIStack = [
    ...(adapterDefURI != null ? [adapterDefURI] : []),
    ...(topLabwareDefURI != null ? [topLabwareDefURI] : []),
    ...(lidDefURI != null ? [lidDefURI] : []),
  ]

  if (moduleType !== FLEX_STACKER_MODULE_TYPE) {
    dispatch(
      createContainer({
        slot: moduleId,
        labwareDefURIStack,
      })
    )
    return
  }

  // Check if the module is a FlexStackerModule and update its state
  if (
    stackerInfo == null ||
    module.moduleState.type !== FLEX_STACKER_MODULE_TYPE
  ) {
    console.error('expected stackerInfo to be passed')
    return
  }
  const currentModuleState = module.moduleState
  const primaryLabwareUuid = topLabwareDefURI != null ? uuid() : null
  const adapterLabwareUuid = adapterDefURI != null ? uuid() : null
  const lidLabwareUuid = lidDefURI != null ? uuid() : null
  const uuids = [adapterLabwareUuid, primaryLabwareUuid, lidLabwareUuid].filter(
    id => id != null
  ) as string[]
  if (stackerInfo.stackerPosition === 'shuttle') {
    // create containers
    dispatch(
      createContainer({
        slot, // shuttle stacks ignore the moduleId and pretend they are on a column 4 slot
        labwareDefURIStack,
        uuids,
      })
    )

    // handle shuttle state update
    dispatch(
      updateStackerModuleState({
        moduleId: module.id,
        moduleState: {
          ...currentModuleState,
          labwareOnShuttle: {
            primaryLabwareId: `${primaryLabwareUuid}:${topLabwareDefURI}`,
            adapterLabwareId:
              adapterLabwareUuid != null
                ? `${adapterLabwareUuid}:${adapterDefURI}`
                : null,
            lidLabwareId:
              lidLabwareUuid != null ? `${lidLabwareUuid}:${lidDefURI}` : null,
          },
        },
      })
    )
  } else {
    // create containers
    if (topLabwareDefURI != null) {
      let accumulatedModuleState = currentModuleState
      for (let _ = 0; _ < stackerInfo.amount; _++) {
        // create containers for the labware
        const primaryLabwareUuid = topLabwareDefURI != null ? uuid() : null
        const adapterLabwareUuid = adapterDefURI != null ? uuid() : null
        const lidLabwareUuid = lidDefURI != null ? uuid() : null
        const uuids = [
          adapterLabwareUuid,
          primaryLabwareUuid,
          lidLabwareUuid,
        ].filter(id => id != null) as string[]
        const hopperUpdate = {
          primaryLabwareId: `${primaryLabwareUuid}:${topLabwareDefURI}`,
          adapterLabwareId:
            adapterLabwareUuid != null
              ? `${adapterLabwareUuid}:${adapterDefURI}`
              : null,
          lidLabwareId:
            lidLabwareUuid != null ? `${lidLabwareUuid}:${lidDefURI}` : null,
        }
        dispatch(
          createContainer({
            slot: moduleId,
            labwareDefURIStack,
            uuids,
          })
        )
        // Build up the state incrementally
        accumulatedModuleState = {
          ...accumulatedModuleState,
          storedLabwareDetails: {
            primaryLabwareURI: topLabwareDefURI,
            adapterLabwareURI: adapterDefURI,
            lidLabwareURI: lidDefURI,
          },
          labwareInHopper:
            accumulatedModuleState.labwareInHopper != null
              ? [...accumulatedModuleState.labwareInHopper, hopperUpdate]
              : [hopperUpdate],
        }
        // handle hopper state update
        dispatch(
          updateStackerModuleState({
            moduleId: module.id,
            moduleState: accumulatedModuleState,
          })
        )
      }
    }
  }
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
) => ThunkAction<CreateModuleAction | ChangeSavedStepFormAction> =
  args => (dispatch, getState) => {
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
