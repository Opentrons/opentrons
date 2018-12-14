// @flow
import {INITIAL_DECK_SETUP_STEP_ID} from '../constants'
import type {SwapPipettesAction, UpdatePipettesAction, PipettesByMount} from './types'
import type {StepIdType} from '../form-types'

export const swapPipettes = (stepId: StepIdType = INITIAL_DECK_SETUP_STEP_ID): SwapPipettesAction => ({
  type: 'SWAP_PIPETTES',
  payload: {stepId},
})

export const updatePipettes = (pipettesByMount: PipettesByMount): UpdatePipettesAction => ({
  type: 'UPDATE_PIPETTES',
  payload: pipettesByMount,
})
