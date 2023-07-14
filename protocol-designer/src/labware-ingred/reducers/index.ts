import { Reducer, combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import omit from 'lodash/omit'
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'
import { FIXED_TRASH_ID } from '../../constants'
import { getPDMetadata } from '../../file-types'
import {
  SingleLabwareLiquidState,
  LocationLiquidState,
  LabwareLiquidState,
} from '@opentrons/step-generation'
import { Action, DeckSlot } from '../../types'
import { LiquidGroupsById, DisplayLabware } from '../types'
import { LoadFileAction } from '../../load-file'
import {
  RemoveWellsContentsAction,
  CreateContainerAction,
  DeleteLiquidGroupAction,
  DuplicateLabwareAction,
  EditLiquidGroupAction,
  SelectLiquidAction,
  SetWellContentsAction,
  RenameLabwareAction,
  DeleteContainerAction,
  OpenAddLabwareModalAction,
  OpenIngredientSelectorAction,
  CloseIngredientSelectorAction,
  DrillDownOnLabwareAction,
  DrillUpFromLabwareAction,
} from '../actions'
import type { LoadLabwareCreateCommand } from '@opentrons/shared-data'
// REDUCERS
// modeLabwareSelection: boolean. If true, we're selecting labware to add to a slot
// (this state just toggles a modal)

// @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const modeLabwareSelection: Reducer<DeckSlot | false, any> = handleActions(
  {
    // @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
    OPEN_ADD_LABWARE_MODAL: (state, action: OpenAddLabwareModalAction) =>
      action.payload.slot,
    CLOSE_LABWARE_SELECTOR: () => false,
    CREATE_CONTAINER: () => false,
  },
  false
)
export type SelectedContainerId = string | null | undefined
// @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const selectedContainerId: Reducer<SelectedContainerId, any> = handleActions(
  {
    OPEN_INGREDIENT_SELECTOR: (
      state,
      action: OpenIngredientSelectorAction
    ): SelectedContainerId => action.payload,
    CLOSE_INGREDIENT_SELECTOR: (
      state,
      action: CloseIngredientSelectorAction
    ): SelectedContainerId => null,
  },
  null
)
export type DrillDownLabwareId = string | null | undefined
// @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const drillDownLabwareId: Reducer<DrillDownLabwareId, any> = handleActions(
  {
    DRILL_DOWN_ON_LABWARE: (
      state,
      action: DrillDownOnLabwareAction
    ): DrillDownLabwareId => action.payload,
    DRILL_UP_FROM_LABWARE: (
      state,
      action: DrillUpFromLabwareAction
    ): DrillDownLabwareId => null,
  },
  null
)
export type ContainersState = Record<string, DisplayLabware | null | undefined>
export interface SelectedLiquidGroupState {
  liquidGroupId: string | null | undefined
  newLiquidGroup?: true
}
const unselectedLiquidGroupState = {
  liquidGroupId: null,
}
// This is only a concern of the liquid page.
// null = nothing selected, newLiquidGroup: true means user is creating new liquid
const selectedLiquidGroup = handleActions(
  {
    // @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
    // TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
    SELECT_LIQUID_GROUP: (
      state: SelectedLiquidGroupState,
      action: SelectLiquidAction
    ): SelectedLiquidGroupState => ({
      liquidGroupId: action.payload,
    }),
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
// @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
export const containers: Reducer<ContainersState, any> = handleActions(
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
      action: DeleteContainerAction
    ): ContainersState =>
      pickBy(
        state,
        // @ts-expect-error(sa, 2021-6-20): pickBy might return null or undefined
        (value: DisplayLabware, key: string) => key !== action.payload.labwareId
      ),
    RENAME_LABWARE: (
      state: ContainersState,
      action: RenameLabwareAction
    ): ContainersState => {
      const { labwareId, name } = action.payload
      // ignore renaming to whitespace
      return name && name.trim()
        ? { ...state, [labwareId]: { ...state[labwareId], nickname: name } }
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

      const loadLabwareCommands = Object.values(file.commands).filter(
        command => command.commandType === 'loadLabware'
      ) as LoadLabwareCreateCommand[]

      return loadLabwareCommands.reduce(
        (acc: ContainersState, command, key): ContainersState => {
          const { loadName, displayName } = command.params
          return {
            ...acc,
            [loadName]: {
              nickname: displayName,
              disambiguationNumber: key,
            },
          }
        },
        {}
      )
    },
  },

  initialLabwareState
)
type SavedLabwareState = Record<string, boolean>

/** Keeps track of which labware have saved nicknames */
// @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
export const savedLabware: Reducer<SavedLabwareState, any> = handleActions(
  {
    DELETE_CONTAINER: (
      state: SavedLabwareState,
      action: DeleteContainerAction
    ) => ({ ...state, [action.payload.labwareId]: false }),
    RENAME_LABWARE: (
      state: SavedLabwareState,
      action: RenameLabwareAction
    ) => ({ ...state, [action.payload.labwareId]: true }),
    DUPLICATE_LABWARE: (
      state: SavedLabwareState,
      action: DuplicateLabwareAction
    ) => ({ ...state, [action.payload.duplicateLabwareId]: true }),
    LOAD_FILE: (
      state: SavedLabwareState,
      action: LoadFileAction
    ): SavedLabwareState => {
      const file = action.payload.file
      const loadLabwareCommands = Object.values(file.commands).filter(
        (command): command is LoadLabwareCreateCommand =>
          command.commandType === 'loadLabware'
      )
      const labware = loadLabwareCommands.reduce(
        (
          acc: Record<
            string,
            {
              slot: string
              definitionId?: string
              displayName?: string
            }
          >,
          command
        ) => {
          const { labwareId, displayName, loadName } = command.params
          const location = command.params.location
          let slot
          if (location === 'offDeck') {
            slot = 'offDeck'
          } else if ('moduleId' in location) {
            slot = location.moduleId
          } else {
            slot = location.slotName
          }

          return {
            ...acc,
            [loadName]: {
              slot,
              definitionId: labwareId,
              displayName: displayName,
            },
          }
        },
        {}
      )
      return mapValues(labware, () => true)
    },
  },
  {}
)
export type IngredientsState = LiquidGroupsById
// @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
export const ingredients: Reducer<IngredientsState, any> = handleActions(
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
      action: DeleteLiquidGroupAction
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
// @ts-expect-error(sa, 2021-6-20): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
export const ingredLocations: Reducer<LocationsState, any> = handleActions(
  {
    SET_WELL_CONTENTS: (
      state: LocationsState,
      action: SetWellContentsAction
    ): LocationsState => {
      const { liquidGroupId, labwareId, wells, volume } = action.payload
      const newWellContents: LocationLiquidState = {
        [liquidGroupId]: {
          volume,
        },
      }
      const updatedWells = wells.reduce<SingleLabwareLiquidState>(
        (acc, wellName) => ({ ...acc, [wellName]: newWellContents }),
        {}
      )
      return { ...state, [labwareId]: { ...state[labwareId], ...updatedWells } }
    },
    DUPLICATE_LABWARE: (
      state: LocationsState,
      action: DuplicateLabwareAction
    ): LocationsState => {
      const { templateLabwareId, duplicateLabwareId } = action.payload
      return { ...state, [duplicateLabwareId]: { ...state[templateLabwareId] } }
    },
    REMOVE_WELLS_CONTENTS: (
      state: LocationsState,
      action: RemoveWellsContentsAction
    ): LocationsState => {
      const { wells, labwareId } = action.payload
      return { ...state, [labwareId]: { ...omit(state[labwareId], wells) } }
    },
    DELETE_LIQUID_GROUP: (
      state: LocationsState,
      action: DeleteLiquidGroupAction
    ): LocationsState => {
      const liquidGroupId = action.payload
      return mapValues(state, labwareContents =>
        mapValues(labwareContents, well => omit(well, liquidGroupId))
      )
    },
    DELETE_CONTAINER: (
      state: LocationsState,
      action: DeleteContainerAction
    ): LocationsState => omit(state, action.payload.labwareId),
    LOAD_FILE: (
      state: LocationsState,
      action: LoadFileAction
    ): LocationsState => getPDMetadata(action.payload.file).ingredLocations,
  },
  {}
)
export interface RootState {
  modeLabwareSelection: DeckSlot | false
  selectedContainerId: SelectedContainerId
  drillDownLabwareId: DrillDownLabwareId
  containers: ContainersState
  savedLabware: SavedLabwareState
  selectedLiquidGroup: SelectedLiquidGroupState
  ingredients: IngredientsState
  ingredLocations: LocationsState
}
// TODO Ian 2018-01-15 factor into separate files
export const rootReducer: Reducer<RootState, Action> = combineReducers({
  modeLabwareSelection,
  selectedContainerId,
  selectedLiquidGroup,
  drillDownLabwareId,
  containers,
  savedLabware,
  ingredients,
  ingredLocations,
})
