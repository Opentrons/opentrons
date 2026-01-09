import { FLEX_STACKER_MODULE_TYPE, getIsTiprack } from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  HOPPER_STACKER_LOCATION,
} from '@opentrons/step-generation'

import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { getRobotType } from '../../file-data/selectors'
import { selectors as labwareDefSelectors } from '../../labware-defs'
import { selectors as stepFormSelectors } from '../../step-forms'
import { updateStackerModuleState } from '../../step-forms/actions/modules'
import { getLabwareEntities } from '../../step-forms/selectors'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import { getLabwarePythonName, uuid } from '../../utils'
import { getNextAvailableDeckSlot, getNextNickname } from '../utils'

import type { FlexStackerStoredLabwareGroup } from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  LabwareEntities,
} from '@opentrons/step-generation'
import type { NormalizedLabware, NormalizedLabwareById } from '../../step-forms'
import type { UpdateStackerModuleStateAction } from '../../step-forms/actions/modules'
import type { ThunkAction } from '../../types'
import type {
  CreateContainerAction,
  CreateContainerArgs,
  DeleteContainerAction,
  DuplicateLabwareAction,
  OpenIngredientSelectorAction,
  ZoomedIntoSlotAction,
} from './actions'

export interface RenameLabwareAction {
  type: 'RENAME_LABWARE'
  payload: {
    labwareId: string
    name?: string | null
  }
}
export const renameLabware: (
  args: RenameLabwareAction['payload']
) => ThunkAction<
  | CreateContainerAction
  | RenameLabwareAction
  | ZoomedIntoSlotAction
  | OpenIngredientSelectorAction
  | UpdateStackerModuleStateAction
> = args => (dispatch, getState) => {
  const { labwareId } = args
  const allNicknamesById =
    uiLabwareSelectors.getLabwareNicknamesById(getState())
  const defaultNickname = allNicknamesById[labwareId]
  const nextNickname = getNextNickname(
    // NOTE: flow won't do Object.values here >:(
    Object.keys(allNicknamesById)
      .filter((id: string) => id !== labwareId) // <- exclude the about-to-be-renamed labware from the nickname list
      .map((id: string) => allNicknamesById[id]),
    args.name || defaultNickname
  )
  return dispatch({
    type: 'RENAME_LABWARE',
    payload: {
      labwareId,
      name: nextNickname,
    },
  })
}
export const createContainer: (
  args: CreateContainerArgs
) => ThunkAction<
  | CreateContainerAction
  | RenameLabwareAction
  | ZoomedIntoSlotAction
  | OpenIngredientSelectorAction
  | UpdateStackerModuleStateAction
> = args => (dispatch, getState) => {
  const { labwareDefURIStack, slot, updateSelectedLabwareId, uuids } = args
  const state = getState()
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  const robotType = getRobotType(state)
  const labwareDefForOt2HS =
    labwareDefSelectors.getLabwareDefsByURI(state)[labwareDefURIStack[0]]
  const availableSlot =
    slot ||
    getNextAvailableDeckSlot(initialDeckSetup, robotType, labwareDefForOt2HS)
  if (availableSlot) {
    let currentSlot = availableSlot
    labwareDefURIStack.forEach((labwareUri, index) => {
      const lwUuid =
        uuids != null && uuids.length > index ? uuids[index] : uuid()
      const id = `${lwUuid}:${labwareUri}`
      const labwareDef =
        labwareDefSelectors.getLabwareDefsByURI(state)[labwareUri]
      const labwareDisplayCategory = labwareDef.metadata.displayCategory
      const isTiprack = getIsTiprack(labwareDef)

      dispatch({
        type: 'CREATE_CONTAINER',
        payload: {
          id,
          labwareDefURI: labwareUri,
          slot: currentSlot,
          displayCategory: labwareDisplayCategory,
        },
      })

      // If the user wants to update the selected labware id,
      // we do not have the option to return the created id, so we need to open the ingredient selector manually.
      if (updateSelectedLabwareId) {
        dispatch({
          type: 'OPEN_INGREDIENT_SELECTOR',
          payload: id,
        })
      }

      if (isTiprack) {
        // Tipracks cannot be named, but should auto-increment.
        // We can't rely on reducers to do that themselves bc they don't have access
        // to both the nickname state and the isTiprack condition
        renameLabware({
          labwareId: id,
        })(dispatch, getState)
      }

      if (availableSlot === 'offDeck') {
        dispatch({
          type: 'ZOOMED_INTO_SLOT',
          payload: { slot: id, cutout: null },
        })
      }
      currentSlot = id
    })
  } else {
    console.warn('no slots available, cannot create labware')
  }
}

export const duplicateLabware: (
  templateLabwareIds: string[]
) => ThunkAction<DuplicateLabwareAction> =
  templateLabwareIds => (dispatch, getState) => {
    const state = getState()
    const robotType = state.fileData.robotType
    const labwareEntities = stepFormSelectors.getLabwareEntities(state)
    const labwareDefsByURI = labwareDefSelectors.getLabwareDefsByURI(state)
    const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
    const allNicknamesById = uiLabwareSelectors.getLabwareNicknamesById(state)

    const templateLabwareDefURIs = templateLabwareIds.map(
      id => labwareEntities[id]?.labwareDefURI
    )

    console.assert(
      !templateLabwareDefURIs.some(uri => uri == null),
      'Missing labwareDefURI for one or more templateLabwareIds:',
      templateLabwareIds
    )

    // determine if duplicating off-deck
    const firstTemplateId = templateLabwareIds[0]
    const firstLabwareStack = initialDeckSetup.labware[firstTemplateId].stack
    const isOffDeck = getSlotInLocationStack(firstLabwareStack) === 'offDeck'

    const firstLabwareDefURI = templateLabwareDefURIs[0] as string
    const labwareDef = labwareDefsByURI[firstLabwareDefURI]
    const displayCategory = labwareDef?.metadata?.displayCategory

    const templateSlot = isOffDeck
      ? 'offDeck'
      : getNextAvailableDeckSlot(initialDeckSetup, robotType, labwareDef)

    //  ensure templateSlot is not null
    if (templateSlot == null) {
      console.error('no slots available, cannot duplicate labware')
      return
    }

    const duplicateNicknames = templateLabwareIds.map(id => {
      const templateNickname = allNicknamesById[id]
      return getNextNickname(Object.values(allNicknamesById), templateNickname)
    })

    let slot: string = templateSlot as string
    templateLabwareIds.reverse().forEach((templateLabwareId, index) => {
      const defURI = labwareEntities[templateLabwareId].labwareDefURI
      const duplicateLabwareId = `${uuid()}:${defURI}`

      dispatch({
        type: 'DUPLICATE_LABWARE',
        payload: {
          duplicateLabwareNickname: duplicateNicknames[index],
          templateLabwareId,
          duplicateLabwareId,
          slot,
          displayCategory,
        },
      })

      if (!isOffDeck) {
        slot = duplicateLabwareId
      }
    })
  }

export interface EditMultipleLabwareAction {
  type: 'EDIT_MULTIPLE_LABWARE_PYTHON_NAME'
  payload: NormalizedLabwareById
}

interface DeleteContainerArgs {
  labwareId: string
}
export const deleteContainer: (
  args: DeleteContainerArgs
) => ThunkAction<
  | DeleteContainerAction
  | EditMultipleLabwareAction
  | UpdateStackerModuleStateAction
> = args => (dispatch, getState) => {
  const { labwareId } = args
  const state = getState()
  const labwareEntities = getLabwareEntities(state)
  const deckSetup = getDeckSetupForActiveItem(state)
  const { modules, labware } = deckSetup
  const isLabwareOnHopper = labware[labwareId].stack.includes(
    HOPPER_STACKER_LOCATION
  )
  const labwareSlot = getSlotInLocationStack(labware[labwareId].stack)
  const moduleOnSlot = Object.values(modules).find(
    ({ slot: moduleSlot }) => moduleSlot === labwareSlot
  )

  const displayCategory =
    labwareEntities[labwareId].def.metadata.displayCategory
  const labwareOfSameCategory = Object.fromEntries(
    Object.entries(labwareEntities).filter(
      ([_, labware]) => labware.def.metadata.displayCategory === displayCategory
    )
  )
  const typeCount = Object.keys(labwareOfSameCategory).length

  dispatch({
    type: 'DELETE_CONTAINER',
    payload: {
      labwareId,
    },
  })

  if (typeCount > 1) {
    const { [labwareId]: _, ...remainingLabwareEntities } =
      labwareOfSameCategory

    const updatedLabwarePythonName: NormalizedLabwareById = Object.keys(
      remainingLabwareEntities
    )
      .sort()
      .reduce<Record<string, NormalizedLabware>>(
        (acc: NormalizedLabwareById, oldId, index) => {
          acc[oldId] = {
            ...remainingLabwareEntities[oldId],
            pythonName: getLabwarePythonName(displayCategory, index + 1),
            displayCategory,
          }
          return acc
        },
        {}
      )

    dispatch({
      type: 'EDIT_MULTIPLE_LABWARE_PYTHON_NAME',
      payload: updatedLabwarePythonName,
    })
  }

  if (isLabwareOnHopper && moduleOnSlot?.type === FLEX_STACKER_MODULE_TYPE) {
    const stackerModuleState: FlexStackerModuleState =
      moduleOnSlot.moduleState as FlexStackerModuleState

    if (stackerModuleState.labwareInHopper != null) {
      const labwareInHopper = stackerModuleState.labwareInHopper.reduce<
        FlexStackerStoredLabwareGroup[]
      >((acc, group) => {
        if (group.primaryLabwareId === labwareId) {
          return acc
        }

        acc.push({
          ...group,
          adapterLabwareId:
            group.adapterLabwareId === labwareId
              ? null
              : group.adapterLabwareId,
          lidLabwareId:
            group.lidLabwareId === labwareId ? null : group.lidLabwareId,
        })

        return acc
      }, [])

      dispatch(
        updateStackerModuleState({
          moduleId: moduleOnSlot.id,
          moduleState: {
            ...stackerModuleState,
            labwareInHopper,
          },
        })
      )
    }
  }
}
