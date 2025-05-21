import { getIsTiprack } from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getRobotType } from '../../file-data/selectors'
import { selectors as labwareDefSelectors } from '../../labware-defs'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getLabwareEntities } from '../../step-forms/selectors'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import { getLabwarePythonName, uuid } from '../../utils'
import { getNextAvailableDeckSlot, getNextNickname } from '../utils'
import {
  selectAdapter,
  selectFixture,
  selectLid,
  selectModule,
  selectTopLabware,
  selectTopLabwareAmount,
} from './actions'

import type { LabwareEntities } from '@opentrons/step-generation'
import type {
  LabwareOnDeck,
  ModuleOnDeck,
  NormalizedLabware,
  NormalizedLabwareById,
} from '../../step-forms'
import type { ThunkAction } from '../../types'
import type { Fixture } from '../types'
import type {
  CreateContainerAction,
  CreateContainerArgs,
  DeleteContainerAction,
  DuplicateLabwareAction,
  SelectAdapterAction,
  SelectFixtureAction,
  SelectLidAction,
  SelectModuleAction,
  SelectTopLabwareAction,
  SelectTopLabwareAmountAction,
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
  CreateContainerAction | RenameLabwareAction | ZoomedIntoSlotAction
> = args => (dispatch, getState) => {
  const { labwareId } = args
  const allNicknamesById = uiLabwareSelectors.getLabwareNicknamesById(
    getState()
  )
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
  CreateContainerAction | RenameLabwareAction | ZoomedIntoSlotAction
> = args => (dispatch, getState) => {
  const { labwareDefURIStack, slot: slotArg } = args
  const state = getState()
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  const robotType = getRobotType(state)
  const labwareDefForOt2HS = labwareDefSelectors.getLabwareDefsByURI(state)[
    labwareDefURIStack[0]
  ]
  const slot =
    slotArg ||
    getNextAvailableDeckSlot(initialDeckSetup, robotType, labwareDefForOt2HS)
  if (slot) {
    let currentSlot = slot
    labwareDefURIStack.forEach(labwareUri => {
      const id = `${uuid()}:${labwareUri}`
      const labwareDef = labwareDefSelectors.getLabwareDefsByURI(state)[
        labwareUri
      ]
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

      if (isTiprack) {
        // Tipracks cannot be named, but should auto-increment.
        // We can't rely on reducers to do that themselves bc they don't have access
        // to both the nickname state and the isTiprack condition
        renameLabware({
          labwareId: id,
        })(dispatch, getState)
      }
      if (slot === 'offDeck') {
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
  templateLabwareId: string
) => ThunkAction<DuplicateLabwareAction> = templateLabwareId => (
  dispatch,
  getState
) => {
  const state = getState()
  const robotType = state.fileData.robotType
  const templateLabwareDefURI = stepFormSelectors.getLabwareEntities(state)[
    templateLabwareId
  ].labwareDefURI
  console.assert(
    templateLabwareDefURI,
    `no labwareDefURI for labware ${templateLabwareId}, cannot run duplicateLabware thunk`
  )
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  const templateLabwareIdIsOffDeck =
    getSlotInLocationStack(
      initialDeckSetup.labware[templateLabwareId].stack
    ) === 'offDeck'
  const labwareDef = labwareDefSelectors.getLabwareDefsByURI(state)[
    templateLabwareDefURI
  ]
  const displayCategory = labwareDef.metadata.displayCategory
  const duplicateSlot = getNextAvailableDeckSlot(
    initialDeckSetup,
    robotType,
    labwareDef
  )
  if (duplicateSlot == null && !templateLabwareIdIsOffDeck) {
    console.error('no slots available, cannot duplicate labware')
  }
  const allNicknamesById = uiLabwareSelectors.getLabwareNicknamesById(state)
  const templateNickname = allNicknamesById[templateLabwareId]
  const duplicateLabwareNickname = getNextNickname(
    Object.keys(allNicknamesById).map((id: string) => allNicknamesById[id]), // NOTE: flow won't do Object.values here >:(
    templateNickname
  )
  const duplicateLabwareId = uuid() + ':' + templateLabwareDefURI

  if (templateLabwareDefURI) {
    if (templateLabwareIdIsOffDeck) {
      dispatch({
        type: 'DUPLICATE_LABWARE',
        payload: {
          duplicateLabwareNickname,
          templateLabwareId,
          duplicateLabwareId,
          slot: 'offDeck',
          displayCategory,
        },
      })
    }
  }
  if (duplicateSlot != null && !templateLabwareIdIsOffDeck) {
    dispatch({
      type: 'DUPLICATE_LABWARE',
      payload: {
        duplicateLabwareNickname,
        templateLabwareId,
        duplicateLabwareId,
        slot: duplicateSlot,
        displayCategory,
      },
    })
  }
}

// interface EditSlotInfo {
//   createdTopLabwareForSlot?: LabwareOnDeck | null
//   createdAdapterForSlot?: LabwareOnDeck | null
//   createdModuleForSlot?: ModuleOnDeck | null
//   preSelectedFixture?: Fixture | null
//   createdLidForSlot?: LabwareOnDeck | null
//   amount?: number
// }

// export const editSlotInfo: (
//   args: EditSlotInfo
// ) => ThunkAction<
//   | SelectTopLabwareAction
//   | SelectAdapterAction
//   | SelectModuleAction
//   | SelectFixtureAction
//   | SelectLidAction
//   | SelectTopLabwareAmountAction
// > = args => dispatch => {
//   const {
//     createdModuleForSlot,
//     createdAdapterForSlot,
//     createdTopLabwareForSlot,
//     preSelectedFixture,
//     createdLidForSlot,
//     amount,
//   } = args
//   dispatch(
//     selectTopLabware({
//       labwareDefUri: createdTopLabwareForSlot?.labwareDefURI ?? null,
//     })
//   )
//   dispatch(
//     selectAdapter({
//       adapterDefUri: createdAdapterForSlot?.labwareDefURI ?? null,
//     })
//   )
//   dispatch(selectModule({ moduleModel: createdModuleForSlot?.model ?? null }))
//   dispatch(selectFixture({ fixture: preSelectedFixture ?? null }))
//   dispatch(
//     selectLid({ labwareDefUri: createdLidForSlot?.labwareDefURI ?? null })
//   )
//   dispatch(selectTopLabwareAmount({ amount: amount ?? 1 }))
// }

export interface EditMultipleLabwareAction {
  type: 'EDIT_MULTIPLE_LABWARE_PYTHON_NAME'
  payload: NormalizedLabwareById
}

interface DeleteContainerArgs {
  labwareId: string
}
export const deleteContainer: (
  args: DeleteContainerArgs
) => ThunkAction<DeleteContainerAction | EditMultipleLabwareAction> = args => (
  dispatch,
  getState
) => {
  const { labwareId } = args
  const state = getState()
  const labwareEntities = getLabwareEntities(state)
  const displayCategory =
    labwareEntities[labwareId].def.metadata.displayCategory
  const labwareOfSameCategory: LabwareEntities = Object.fromEntries(
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
    const {
      [labwareId]: _,
      ...remainingLabwareEntities
    } = labwareOfSameCategory

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
}
