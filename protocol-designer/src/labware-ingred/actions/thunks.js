// @flow
import assert from 'assert'
import { uuid } from '../../utils'
import { selectors as labwareIngredsSelectors } from '../selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import type {
  CreateContainerArgs,
  CreateContainerAction,
  DuplicateLabwareAction,
} from './actions'
import type { BaseState, GetState, ThunkDispatch } from '../../types'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'
import { getNextAvailableSlot } from '../utils'

function getNextDisambiguationNumber(
  state: BaseState,
  newLabwareType: string
): number {
  const labwareEntities = stepFormSelectors.getLabwareEntities(state)
  const labwareNamesMap = labwareIngredsSelectors.getLabwareNameInfo(state)
  const allIds = Object.keys(labwareEntities)
  const sameTypeLabware = allIds.filter(
    labwareId => labwareEntities.type === newLabwareType
  )
  const disambigNumbers = sameTypeLabware.map(
    labwareId =>
      (labwareNamesMap[labwareId] &&
        labwareNamesMap[labwareId].disambiguationNumber) ||
      0
  )

  return disambigNumbers.length > 0 ? Math.max(...disambigNumbers) + 1 : 1
}

export const createContainer = (args: CreateContainerArgs) => (
  dispatch: ThunkDispatch<CreateContainerAction>,
  getState: GetState
) => {
  const state = getState()
  const disambiguationNumber = getNextDisambiguationNumber(
    state,
    args.containerType
  )
  const initialSetupStep = stepFormSelectors.getSavedStepForms(state)[
    INITIAL_DECK_SETUP_STEP_ID
  ]
  const labwareLocations =
    (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}

  const slot = args.slot || getNextAvailableSlot(labwareLocations)
  if (slot) {
    dispatch({
      type: 'CREATE_CONTAINER',
      payload: {
        ...args,
        id: `${uuid()}:${args.containerType}`,
        disambiguationNumber,
        slot,
      },
    })
  } else {
    console.warn('no slots available, cannot create labware')
  }
}

export const duplicateLabware = (templateLabwareId: string) => (
  dispatch: ThunkDispatch<DuplicateLabwareAction>,
  getState: GetState
) => {
  const state = getState()
  const templateLabwareType = stepFormSelectors.getLabwareTypesById(state)[
    templateLabwareId
  ]
  assert(
    templateLabwareType,
    `no type for labware ${templateLabwareId}, cannot run duplicateLabware thunk`
  )

  const initialSetupStep = stepFormSelectors.getSavedStepForms(state)[
    INITIAL_DECK_SETUP_STEP_ID
  ]
  const labwareLocations =
    (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}
  const duplicateSlot = getNextAvailableSlot(labwareLocations)

  if (!duplicateSlot)
    console.warn('no slots available, cannot duplicate labware')

  if (templateLabwareType && duplicateSlot) {
    dispatch({
      type: 'DUPLICATE_LABWARE',
      payload: {
        duplicateDisambiguationNumber: getNextDisambiguationNumber(
          state,
          templateLabwareType
        ),
        templateLabwareId,
        duplicateLabwareId: uuid(),
        slot: duplicateSlot,
      },
    })
  }
}
