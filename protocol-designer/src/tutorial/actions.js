// @flow
import type {HintKey} from './index'

export type AddHintAction = {
  type: 'ADD_HINT',
  payload: {hint: HintKey},
}
export type RemoveHintAction = {
  type: 'REMOVE_HINT',
  payload: {hint: HintKey},
}

export const addHint = (hint: HintKey): AddHintAction => ({
  type: 'ADD_HINT',
  payload: {hint},
})

export const removeHint = (hint: HintKey): RemoveHintAction => ({
  type: 'REMOVE_HINT',
  payload: {hint},
})
