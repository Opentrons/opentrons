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
  amount: number
  isOnShuttle?: boolean
}

interface StackedLabware {
  defURI: string
  uuid: string
  role: 'adapter' | 'primary' | 'lid'
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
  const { slot, labwareDefURIGroup, isOnShuttle = false, amount } = args
  const state = getState()
  const deckSetup = getDeckSetupForActiveItem(state)
  const modules = deckSetup.modules

  const module = Object.values(modules).find(module => module.slot === slot)
  const moduleId = module?.id
  const { adapterDefURI, topLabwareDefURI, lidDefURI } = labwareDefURIGroup
  const baseStack: Array<Omit<StackedLabware, 'uuid'>> = [
    ...(adapterDefURI != null
      ? [{ defURI: adapterDefURI, role: 'adapter' as const }]
      : []),
    ...(topLabwareDefURI != null
      ? [{ defURI: topLabwareDefURI, role: 'primary' as const }]
      : []),
    ...(lidDefURI != null ? [{ defURI: lidDefURI, role: 'lid' as const }] : []),
  ]

  const labwareGroups: StackedLabware[][] = Array.from({ length: amount }).map(
    () =>
      baseStack.map(item => ({
        ...item,
        uuid: uuid(),
      }))
  )
  const stackedLabware = labwareGroups.flat()

  const labwareDefURIStack = stackedLabware.map(info => info.defURI)
  const uuids = stackedLabware.map(info => info.uuid)

  if (moduleId) {
    dispatch(
      createContainer({
        slot: moduleId,
        labwareDefURIStack,
        uuids,
      })
    )

    const getTopByRole = (role: StackedLabware['role']): StackedLabware | null  =>
      [...stackedLabware].reverse().find(lw => lw.role === role) ?? null

    const topPrimary = getTopByRole('primary')
    const topAdapter = getTopByRole('adapter')
    const topLid = getTopByRole('lid')

    // Check if the module is a FlexStackerModule and update its state
    if (module?.type === FLEX_STACKER_MODULE_TYPE) {
      const currentModuleState = module.moduleState as FlexStackerModuleState
      if (currentModuleState.type === FLEX_STACKER_MODULE_TYPE) {
        // handle shuttle state update
        if (isOnShuttle) {
          if (topPrimary != null) {
            dispatch(
              updateStackerModuleState({
                moduleId: module.id,
                moduleState: {
                  ...currentModuleState,
                  labwareOnShuttle: {
                    primaryLabwareId: `${topPrimary.uuid}:${topPrimary.defURI}`,
                    adapterLabwareId:
                      topAdapter != null
                        ? `${topAdapter.uuid}:${topAdapter.defURI}`
                        : null,
                    lidLabwareId:
                      topLid != null ? `${topLid.uuid}:${topLid.defURI}` : null,
                  },
                },
              })
            )
          } else {
            console.error(
              'expected to find a topPrimary labware in createContainer thunk for updating flex stacker state but could not'
            )
          }
        } else {
          // handle hopper state update
          if (topPrimary != null) {
            dispatch(
              updateStackerModuleState({
                moduleId: module.id,
                moduleState: {
                  ...currentModuleState,
                  storedLabwareDetails: {
                    primaryLabwareURI: topPrimary.defURI,
                    adapterLabwareURI: topAdapter?.defURI ?? null,
                    lidLabwareURI: topLid?.defURI ?? null,
                  },
                  labwareInHopper: [
                    {
                      primaryLabwareId: `${topPrimary.uuid}:${topPrimary.defURI}`,
                      adapterLabwareId:
                        topAdapter != null
                          ? `${topAdapter.uuid}:${topAdapter.defURI}`
                          : null,
                      lidLabwareId:
                        topLid != null
                          ? `${topLid.uuid}:${topLid.defURI}`
                          : null,
                    },
                  ],
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
