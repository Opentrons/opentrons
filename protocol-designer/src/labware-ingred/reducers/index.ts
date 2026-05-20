import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import pickBy from 'lodash/pickBy'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import { getAllDefinitions } from '@opentrons/shared-data'

import { getPDMetadata } from '../../file-types'
import { getOnlyLatestDefs } from '../../labware-defs'
import { getMigratedLabwareId } from '../utils'

import type { Reducer } from 'redux'
import type {
  LabwareLiquidState,
  LiquidEntities,
  LiquidEntity,
  LocationLiquidState,
  SingleLabwareLiquidState,
} from '@opentrons/step-generation'
import type { LoadFileAction } from '../../load-file'
import type { Action, DeckSlot } from '../../types'
import type {
  CloseIngredientSelectorAction,
  CreateContainerAction,
  DeleteContainerAction,
  DeleteLiquidGroupAction,
  DrillDownOnLabwareAction,
  DrillUpFromLabwareAction,
  DuplicateLabwareAction,
  EditLiquidGroupAction,
  EditMultipleLiquidGroupsAction,
  EditSlotInfoAction,
  GenerateNewProtocolAction,
  OpenAddLabwareModalAction,
  OpenIngredientSelectorAction,
  RemoveWellsContentsAction,
  RenameLabwareAction,
  SelectAdapterAction,
  SelectFixtureAction,
  SelectLidAction,
  SelectLiquidAction,
  SelectModuleAction,
  SelectTopLabwareAction,
  SelectTopLabwareAmountAction,
  SetWellContentsAction,
  ZoomedIntoSlotAction,
} from '../actions'
import type {
  DisplayLabware,
  GenerateNewProtocolState,
  ZoomedIntoSlotInfoState,
} from '../types'

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
export type SelectedMultipleContainerIds = string[] | null | undefined

const selectedMultipleContainerIds: Reducer<
  SelectedMultipleContainerIds,
  any
> = (state, action): SelectedMultipleContainerIds => {
  switch (action.type) {
    case 'OPEN_MULTIPLE_INGREDIENTS_SELECTOR':
      return action.payload
    case 'CLOSE_INGREDIENT_SELECTOR':
      return null
    default:
      return state ?? null
  }
}

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
) as Reducer<SelectedLiquidGroupState, Action>
const initialLabwareState: ContainersState = {}
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
      const metadata = getPDMetadata(file)
      const allLabwareDefs = getAllDefinitions()
      const latestDefs = getOnlyLatestDefs()
      const containers: ContainersState = Object.entries(
        metadata.labware
      ).reduce((acc: ContainersState, [id, labwareLoadInfo], key) => {
        const latestLabwareId = getMigratedLabwareId(
          id,
          metadata.labware,
          allLabwareDefs,
          latestDefs
        )
        if (latestLabwareId == null) {
          return acc
        }

        acc[latestLabwareId] = {
          nickname: labwareLoadInfo.displayName,
          disambiguationNumber: key,
        }

        return acc
      }, {})

      return containers
    },
  },
  initialLabwareState
)

export type IngredientsState = LiquidEntities
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
    EDIT_MULTIPLE_LIQUID_GROUPS_PYTHON_NAME: (
      state: IngredientsState,
      action: EditMultipleLiquidGroupsAction
    ): IngredientsState => {
      return {
        ...state,
        ...action.payload,
      }
    },
    LOAD_FILE: (
      state: IngredientsState,
      action: LoadFileAction
    ): IngredientsState => {
      const ingredients = getPDMetadata(action.payload.file).ingredients

      return Object.entries(ingredients).reduce<Record<string, LiquidEntity>>(
        (acc, [key, ingredient]) => {
          acc[key] = {
            ...ingredient,
            pythonName: `liquid_${parseInt(key) + 1}`,
          }
          return acc
        },
        {}
      )
    },
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

      // Handle single labwareId or array of labwareIds
      const labwareIds = Array.isArray(labwareId) ? labwareId : [labwareId]

      return labwareIds.reduce<LocationsState>(
        (acc, id) => ({
          ...acc,
          [id]: { ...acc[id], ...updatedWells },
        }),
        state
      )
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
      const labwareIds = Array.isArray(labwareId) ? labwareId : [labwareId]
      return labwareIds.reduce<LocationsState>((acc, id) => {
        const updatedLabware = omit(acc[id], wells)
        if (Object.keys(updatedLabware).length > 0) {
          return { ...acc, [id]: updatedLabware }
        } else {
          return omit(acc, id)
        }
      }, state)
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
    ): LocationsState => {
      const ingredLocations = getPDMetadata(action.payload.file).ingredLocations
      const labware = getPDMetadata(action.payload.file).labware
      const allLabwareDefs = getAllDefinitions()
      const latestDefs = getOnlyLatestDefs()

      return Object.entries(ingredLocations).reduce(
        (acc: LocationsState, [labwareId, liquidIngredient]) => {
          const latestLabwareId = getMigratedLabwareId(
            labwareId,
            labware,
            allLabwareDefs,
            latestDefs
          )
          if (latestLabwareId == null) {
            return acc
          }
          acc[latestLabwareId] = liquidIngredient
          return acc
        },
        {}
      )
    },
  },
  {}
)

const selectedSlotInfoInitialState: ZoomedIntoSlotInfoState = {
  selectedTopLabware: { labwareDefURI: null, amount: 1 },
  selectedAdapterDefURI: null,
  selectedModuleModel: null,
  selectedFixture: null,
  selectedLidLabware: null,
  selectedSlot: { slot: null, cutout: null },
}

export const zoomedInSlotInfo = ((
  state: ZoomedIntoSlotInfoState = selectedSlotInfoInitialState,
  action:
    | SelectTopLabwareAction
    | SelectAdapterAction
    | SelectModuleAction
    | SelectFixtureAction
    | ZoomedIntoSlotAction
    | SelectLidAction
    | SelectTopLabwareAmountAction
    | EditSlotInfoAction
): ZoomedIntoSlotInfoState => {
  switch (action.type) {
    case 'SELECT_TOP_LABWARE': {
      const { labwareDefURI } = action.payload
      return {
        ...state,
        selectedTopLabware: {
          labwareDefURI,
          // defaults amount to 1 if labware is selected
          amount:
            labwareDefURI != null && state.selectedTopLabware.amount === 0
              ? 1
              : state.selectedTopLabware.amount,
        },
      }
    }
    case 'SELECT_ADAPTER': {
      const { adapterDefURI } = action.payload
      return { ...state, selectedAdapterDefURI: adapterDefURI }
    }
    case 'SELECT_MODULE': {
      const { moduleModel } = action.payload
      return { ...state, selectedModuleModel: moduleModel }
    }
    case 'SELECT_FIXTURE': {
      const { fixture } = action.payload
      return { ...state, selectedFixture: fixture }
    }
    case 'ZOOMED_INTO_SLOT': {
      const { slot, cutout } = action.payload
      return {
        ...state,
        selectedSlot: {
          slot,
          cutout,
        },
      }
    }
    case 'SELECT_LID': {
      const { labwareDefURI } = action.payload
      return {
        ...state,
        selectedLidLabware: labwareDefURI,
      }
    }
    case 'SELECT_TOP_LABWARE_AMOUNT': {
      const { amount } = action.payload
      return {
        ...state,
        selectedTopLabware: {
          labwareDefURI: state.selectedTopLabware.labwareDefURI,
          amount,
        },
      }
    }
    case 'EDIT_SLOT_INFO': {
      const {
        labwareDefURI,
        adapterDefURI,
        moduleModel,
        fixture,
        lidDefURI,
        amount,
      } = action.payload
      return {
        ...state,
        selectedTopLabware: {
          labwareDefURI: labwareDefURI ?? null,
          amount: amount ?? 1,
        },
        selectedAdapterDefURI: adapterDefURI ?? null,
        selectedModuleModel: moduleModel ?? null,
        selectedFixture: fixture ?? null,
        selectedLidLabware: lidDefURI ?? null,
      }
    }
    default:
      return state
  }
}) as Reducer<ZoomedIntoSlotInfoState, Action>

const initialGenerateNewProtocolState: GenerateNewProtocolState = {
  isNewProtocol: false,
}

export const generateNewProtocol = ((
  state: GenerateNewProtocolState = initialGenerateNewProtocolState,
  action: GenerateNewProtocolAction
): GenerateNewProtocolState => {
  switch (action.type) {
    case 'GENERATE_NEW_PROTOCOL': {
      const { isNewProtocol } = action.payload
      return { ...state, isNewProtocol }
    }
    default:
      return state
  }
}) as Reducer<GenerateNewProtocolState, Action>
export interface RootState {
  zoomedInSlotInfo: ZoomedIntoSlotInfoState
  modeLabwareSelection: DeckSlot | false
  selectedContainerId: SelectedContainerId
  selectedMultipleContainerIds: SelectedMultipleContainerIds
  drillDownLabwareId: DrillDownLabwareId
  containers: ContainersState
  selectedLiquidGroup: SelectedLiquidGroupState
  ingredients: IngredientsState
  ingredLocations: LocationsState
  generateNewProtocol: GenerateNewProtocolState
}

// TODO Ian 2018-01-15 factor into separate files
export const rootReducer = combineReducers({
  zoomedInSlotInfo,
  modeLabwareSelection,
  selectedContainerId,
  selectedLiquidGroup,
  selectedMultipleContainerIds,
  drillDownLabwareId,
  containers,
  ingredients,
  ingredLocations,
  generateNewProtocol,
}) as Reducer<RootState, Action>
