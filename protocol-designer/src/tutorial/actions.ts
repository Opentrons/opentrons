import type { HintKey } from './index'
export interface AddHintAction {
  type: 'ADD_HINT'
  payload: {
    hintKey: HintKey
  }
}
export const addHint = (hintKey: HintKey): AddHintAction => ({
  type: 'ADD_HINT',
  payload: {
    hintKey,
  },
})
export interface RemoveHintAction {
  type: 'REMOVE_HINT'
  payload: {
    hintKey: HintKey
    // persist hint removal across sessions
    rememberDismissal: boolean
  }
}
export const removeHint = (
  hintKey: HintKey,
  rememberDismissal: boolean
): RemoveHintAction => ({
  type: 'REMOVE_HINT',
  payload: {
    hintKey,
    rememberDismissal,
  },
})
export interface ClearAllHintDismissalsAction {
  type: 'CLEAR_ALL_HINT_DISMISSALS'
}
export const clearAllHintDismissals = (): ClearAllHintDismissalsAction => ({
  type: 'CLEAR_ALL_HINT_DISMISSALS',
})
