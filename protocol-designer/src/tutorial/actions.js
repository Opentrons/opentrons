// @flow
import type {HintKey} from './index'

export type AddHintAction = {
  type: 'ADD_HINT',
  payload: {hintKey: HintKey},
}
export type RemoveHintAction = {
  type: 'REMOVE_HINT',
  payload: {
    hintKey: HintKey,
    // persist hint removal across sessions
    rememberDismissal: boolean,
  },
}

export const addHint = (hintKey: HintKey): AddHintAction => ({
  type: 'ADD_HINT',
  payload: {hintKey},
})

export const removeHint = (hintKey: HintKey, rememberDismissal: boolean): RemoveHintAction => ({
  type: 'REMOVE_HINT',
  payload: {hintKey, rememberDismissal},
})
