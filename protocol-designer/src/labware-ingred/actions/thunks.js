// @flow
import assert from 'assert'
import {uuid} from '../../utils'
import {selectors as labwareIngredsSelectors} from '../selectors'
import {selectors as stepFormSelectors} from '../../step-forms'
import type {
  CreateContainerArgs,
  CreateContainerAction,
  DuplicateLabwareAction,
} from './actions'
import type {BaseState, GetState, ThunkDispatch} from '../../types'

function getNextDisambiguationNumber (state: BaseState, newLabwareType: string): number {
  const labwareTypesById = stepFormSelectors.getLabwareTypesById(state)
  const labwareNamesMap = labwareIngredsSelectors.getLabwareNameInfo(state)
  const allIds = Object.keys(labwareTypesById)
  const sameTypeLabware = allIds.filter(labwareId =>
    labwareTypesById[labwareId] === newLabwareType)
  const disambigNumbers = sameTypeLabware.map(labwareId =>
    (labwareNamesMap[labwareId] &&
    labwareNamesMap[labwareId].disambiguationNumber) || 0)

  return disambigNumbers.length > 0
    ? Math.max(...disambigNumbers) + 1
    : 1
}

export const createContainer = (args: CreateContainerArgs) =>
  (dispatch: ThunkDispatch<CreateContainerAction>, getState: GetState) => {
    const disambiguationNumber = getNextDisambiguationNumber(getState(), args.containerType)

    dispatch({
      type: 'CREATE_CONTAINER',
      payload: {
        ...args,
        id: `${uuid()}:${args.containerType}`,
        disambiguationNumber,
      },
    })
  }

export const duplicateLabware = (templateLabwareId: string) =>
  (dispatch: ThunkDispatch<DuplicateLabwareAction>, getState: GetState) => {
    const state = getState()
    const templateLabwareType = stepFormSelectors.getLabwareTypesById(state)[templateLabwareId]
    assert(templateLabwareType, `no type for labware ${templateLabwareId}, cannot run duplicateLabware thunk`)
    if (templateLabwareType) {
      dispatch({
        type: 'DUPLICATE_LABWARE',
        payload: {
          duplicateDisambiguationNumber: getNextDisambiguationNumber(state, templateLabwareType),
          templateLabwareId,
          duplicateLabwareId: uuid(),
        },
      })
    }
  }
