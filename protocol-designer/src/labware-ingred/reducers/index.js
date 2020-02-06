// @flow
import { combineReducers } from 'redux'
import { handleActions, type ActionType } from 'redux-actions'
import omit from 'lodash/omit'
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'

import * as actions from '../actions'
import { FIXED_TRASH_ID } from '../../constants'
import { getPDMetadata } from '../../file-types'
import type { Action, DeckSlot } from '../../types'
import type {
  SingleLabwareLiquidState,
  LabwareLiquidState,
} from '../../step-generation'
import type { LiquidGroupsById, DisplayLabware } from '../types'
import type { LoadFileAction } from '../../load-file'
import type {
  RemoveWellsContents,
  CreateContainerAction,
  DeleteLiquidGroup,
  DuplicateLabwareAction,
  EditLiquidGroupAction,
  SelectLiquidAction,
  SetWellContentsAction,
  RenameLabwareAction,
} from '../actions'

// REDUCERS

// modeLabwareSelection: boolean. If true, we're selecting labware to add to a slot
// (this state just toggles a modal)
const modeLabwareSelection = handleActions(
  {
    OPEN_ADD_LABWARE_MODAL: (
      state,
      action: ActionType<typeof actions.openAddLabwareModal>
    ) => action.payload.slot,
    CLOSE_LABWARE_SELECTOR: () => false,
    CREATE_CONTAINER: () => false,
  },
  false
)

export type SelectedContainerId = ?string
const selectedContainerId = handleActions(
  {
    OPEN_INGREDIENT_SELECTOR: (
      state,
      action: ActionType<typeof actions.openIngredientSelector>
    ): SelectedContainerId => action.payload,
    CLOSE_INGREDIENT_SELECTOR: (
      state,
      action: ActionType<typeof actions.closeIngredientSelector>
    ): SelectedContainerId => null,
  },
  null
)

export type DrillDownLabwareId = ?string
const drillDownLabwareId = handleActions(
  {
    DRILL_DOWN_ON_LABWARE: (
      state,
      action: ActionType<typeof actions.drillDownOnLabware>
    ): DrillDownLabwareId => action.payload,
    DRILL_UP_FROM_LABWARE: (
      state,
      action: ActionType<typeof actions.drillUpFromLabware>
    ): DrillDownLabwareId => null,
  },
  null
)

export type ContainersState = {
  [id: string]: ?DisplayLabware,
}

export type SelectedLiquidGroupState = {
  liquidGroupId: ?string,
  newLiquidGroup?: true,
}
const unselectedLiquidGroupState = { liquidGroupId: null }
// This is only a concern of the liquid page.
// null = nothing selected, newLiquidGroup: true means user is creating new liquid
const selectedLiquidGroup = handleActions(
  {
    SELECT_LIQUID_GROUP: (
      state: SelectedLiquidGroupState,
      action: SelectLiquidAction
    ): SelectedLiquidGroupState => ({ liquidGroupId: action.payload }),
    DELETE_LIQUID_GROUP: () => unselectedLiquidGroupState,
    DESELECT_LIQUID_GROUP: () => unselectedLiquidGroupState,
    CREATE_NEW_LIQUID_GROUP_FORM: (): SelectedLiquidGroupState => ({
      liquidGroupId: null,
      newLiquidGroup: true,
    }),
    EDIT_LIQUID_GROUP: () => unselectedLiquidGroupState, // clear on form save
  },
  unselectedLiquidGroupState
)

const initialLabwareState: ContainersState = {
  [FIXED_TRASH_ID]: {
    nickname: 'Trash',
  },
}

export const containers = handleActions<ContainersState, *>(
  {
    CREATE_CONTAINER: (
      state: ContainersState,
      action: CreateContainerAction
    ): ContainersState => {
      const id = action.payload.id
      return {
        ...state,
        [id]: {
          nickname: null, // create with null nickname, so we force explicit naming.
        },
      }
    },
    DELETE_CONTAINER: (
      state: ContainersState,
      action: ActionType<typeof actions.deleteContainer>
    ): ContainersState =>
      pickBy(
        state,
        (value: DisplayLabware, key: string) => key !== action.payload.labwareId
      ),
    RENAME_LABWARE: (
      state: ContainersState,
      action: RenameLabwareAction
    ): ContainersState => {
      const { labwareId, name } = action.payload
      // ignore renaming to whitespace
      return name && name.trim()
        ? {
            ...state,
            [labwareId]: {
              ...state[labwareId],
              nickname: name,
            },
          }
        : state
    },
    DUPLICATE_LABWARE: (
      state: ContainersState,
      action: DuplicateLabwareAction
    ): ContainersState => {
      const { duplicateLabwareId, duplicateLabwareNickname } = action.payload
      return {
        ...state,
        [duplicateLabwareId]: {
          nickname: duplicateLabwareNickname,
        },
      }
    },
    LOAD_FILE: (
      state: ContainersState,
      action: LoadFileAction
    ): ContainersState => {
      const { file } = action.payload
      const allFileLabware = file.labware
      const sortedLabwareIds: Array<string> = Object.keys(allFileLabware).sort(
        (a, b) =>
          Number(allFileLabware[a].slot) - Number(allFileLabware[b].slot)
      )

      return sortedLabwareIds.reduce(
        (acc: ContainersState, id): ContainersState => {
          const fileLabware = allFileLabware[id]
          const nickname = fileLabware.displayName
          const disambiguationNumber =
            Object.keys(acc).filter(
              (filterId: string) =>
                allFileLabware[filterId].displayName === nickname
            ).length + 1
          return {
            ...acc,
            [id]: {
              nickname,
              disambiguationNumber,
            },
          }
        },
        {}
      )
    },
  },
  initialLabwareState
)

type SavedLabwareState = { [labwareId: string]: boolean }
/** Keeps track of which labware have saved nicknames */
export const savedLabware = handleActions<SavedLabwareState, *>(
  {
    DELETE_CONTAINER: (
      state: SavedLabwareState,
      action: ActionType<typeof actions.deleteContainer>
    ) => ({
      ...state,
      [action.payload.labwareId]: false,
    }),
    RENAME_LABWARE: (
      state: SavedLabwareState,
      action: RenameLabwareAction
    ) => ({
      ...state,
      [action.payload.labwareId]: true,
    }),
    DUPLICATE_LABWARE: (
      state: SavedLabwareState,
      action: DuplicateLabwareAction
    ) => ({
      ...state,
      [action.payload.duplicateLabwareId]: true,
    }),
    LOAD_FILE: (
      state: SavedLabwareState,
      action: LoadFileAction
    ): SavedLabwareState => mapValues(action.payload.file.labware, () => true),
  },
  {}
)

type IngredientsState = LiquidGroupsById
export const ingredients = handleActions<IngredientsState, *>(
  {
    EDIT_LIQUID_GROUP: (
      state: IngredientsState,
      action: EditLiquidGroupAction
    ): IngredientsState => {
      const { liquidGroupId } = action.payload
      return {
        ...state,
        [liquidGroupId]: { ...state[liquidGroupId], ...action.payload },
      }
    },
    DELETE_LIQUID_GROUP: (
      state: IngredientsState,
      action: DeleteLiquidGroup
    ): IngredientsState => {
      const liquidGroupId = action.payload
      return omit(state, liquidGroupId)
    },
    LOAD_FILE: (
      state: IngredientsState,
      action: LoadFileAction
    ): IngredientsState => getPDMetadata(action.payload.file).ingredients,
  },
  {}
)

type LocationsState = LabwareLiquidState

export const ingredLocations = handleActions<LocationsState, *>(
  {
    SET_WELL_CONTENTS: (
      state: LocationsState,
      action: SetWellContentsAction
    ): LocationsState => {
      const { liquidGroupId, labwareId, wells, volume } = action.payload
      const newWellContents = { [liquidGroupId]: { volume } }
      const updatedWells = wells.reduce(
        (acc, wellName): SingleLabwareLiquidState => ({
          ...acc,
          [wellName]: newWellContents,
        }),
        {}
      )

      return {
        ...state,
        [labwareId]: {
          ...state[labwareId],
          ...updatedWells,
        },
      }
    },
    DUPLICATE_LABWARE: (
      state: LocationsState,
      action: DuplicateLabwareAction
    ): LocationsState => {
      const { templateLabwareId, duplicateLabwareId } = action.payload
      return {
        ...state,
        [duplicateLabwareId]: {
          ...state[templateLabwareId],
        },
      }
    },
    REMOVE_WELLS_CONTENTS: (
      state: LocationsState,
      action: RemoveWellsContents
    ): LocationsState => {
      const { wells, labwareId } = action.payload
      return {
        ...state,
        [labwareId]: {
          ...omit(state[labwareId], wells),
        },
      }
    },
    DELETE_LIQUID_GROUP: (
      state: LocationsState,
      action: DeleteLiquidGroup
    ): LocationsState => {
      const liquidGroupId = action.payload
      return mapValues(state, labwareContents =>
        mapValues(labwareContents, well => omit(well, liquidGroupId))
      )
    },
    DELETE_CONTAINER: (
      state: LocationsState,
      action: ActionType<typeof actions.deleteContainer>
    ): LocationsState => omit(state, action.payload.labwareId),
    LOAD_FILE: (
      state: LocationsState,
      action: LoadFileAction
    ): LocationsState => getPDMetadata(action.payload.file).ingredLocations,
  },
  {}
)

export type RootState = {|
  modeLabwareSelection: ?DeckSlot,
  selectedContainerId: SelectedContainerId,
  drillDownLabwareId: DrillDownLabwareId,
  containers: ContainersState,
  savedLabware: SavedLabwareState,
  selectedLiquidGroup: SelectedLiquidGroupState,
  ingredients: IngredientsState,
  ingredLocations: LocationsState,
|}

// TODO Ian 2018-01-15 factor into separate files
const rootReducer = combineReducers<_, Action>({
  modeLabwareSelection,
  selectedContainerId,
  selectedLiquidGroup,
  drillDownLabwareId,
  containers,
  savedLabware,
  ingredients,
  ingredLocations,
})

export default rootReducer
