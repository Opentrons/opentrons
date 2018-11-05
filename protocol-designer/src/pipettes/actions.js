// @flow
import type {UpdatePipettesAction, PipettesByMount} from './types'

export const swapPipettes = () => ({
  type: 'SWAP_PIPETTES',
})

export const updatePipettes = (pipettesByMount: PipettesByMount): UpdatePipettesAction => ({
  type: 'UPDATE_PIPETTES',
  payload: pipettesByMount,
})
