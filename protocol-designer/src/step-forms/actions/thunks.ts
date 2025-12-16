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
import type { FlexStackerModuleState } from '@opentrons/step-generation'
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
  isOnShuttle?: boolean
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
  const { slot, labwareDefURIGroup, isOnShuttle = false } = args
  const state = getState()
  const deckSetup = getDeckSetupForActiveItem(state)
  const modules = deckSetup.modules

  const module = Object.values(modules).find(module => module.slot === slot)
  const moduleId = module?.id
  const { adapterDefURI, topLabwareDefURI, lidDefURI } = labwareDefURIGroup
  const labwareDefURIStack = [
    ...(adapterDefURI != null ? [adapterDefURI] : []),
    ...(topLabwareDefURI != null ? [topLabwareDefURI] : []),
    ...(lidDefURI != null ? [lidDefURI] : []),
  ]
  const primaryLabwareUuid = topLabwareDefURI != null ? uuid() : null
  const adapterLabwareUuid = adapterDefURI != null ? uuid() : null
  const lidLabwareUuid = lidDefURI != null ? uuid() : null

  const uuids = [adapterLabwareUuid, primaryLabwareUuid, lidLabwareUuid].filter(
    id => id != null
  ) as string[]

  if (moduleId) {
    dispatch(
      createContainer({
        slot: moduleId,
        labwareDefURIStack,
        uuids,
      })
    )

    // Check if the module is a FlexStackerModule and update its state
    if (module?.type === FLEX_STACKER_MODULE_TYPE) {
      const currentModuleState = module.moduleState as FlexStackerModuleState
      if (currentModuleState.type === FLEX_STACKER_MODULE_TYPE) {
        // handle shuttle state update
        if (isOnShuttle) {
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
                    lidLabwareUuid != null
                      ? `${lidLabwareUuid}:${lidDefURI}`
                      : null,
                },
              },
            })
          )
        } else {
          // handle hopper state update
          const update = {
            primaryLabwareId: `${primaryLabwareUuid}:${topLabwareDefURI}`,
            adapterLabwareId:
              adapterLabwareUuid != null
                ? `${adapterLabwareUuid}:${adapterDefURI}`
                : null,
            lidLabwareId:
              lidLabwareUuid != null ? `${lidLabwareUuid}:${lidDefURI}` : null,
          }
          if (topLabwareDefURI != null) {
            dispatch(
              updateStackerModuleState({
                moduleId: module.id,
                moduleState: {
                  ...currentModuleState,
                  storedLabwareDetails: {
                    primaryLabwareURI: topLabwareDefURI,
                    adapterLabwareURI: adapterDefURI,
                    lidLabwareURI: lidDefURI,
                  },
                  labwareInHopper: [update],
                },
              })
            )
          }
        }
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
