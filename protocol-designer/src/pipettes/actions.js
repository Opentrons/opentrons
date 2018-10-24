// @flow
import type {UpdatePipettesAction, PipetteReducerState} from './types'

export const swapPipettes = () => ({
  type: 'SWAP_PIPETTES',
})

export const updatePipettes = (nextPipettesSlice: PipetteReducerState): UpdatePipettesAction => ({
  type: 'UPDATE_PIPETTES',
  payload: nextPipettesSlice,
})
