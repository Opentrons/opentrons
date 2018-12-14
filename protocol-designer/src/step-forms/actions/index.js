// @flow
import type {Mount} from '@opentrons/components'
import type {StepIdType} from '../../form-types'

type MovePipettesPayload = {
  stepId: StepIdType,
  update: {[pipetteId: string]: ?Mount},
}
export type MovePipettesAction = {
  type: 'MOVE_PIPETTES',
  payload: MovePipettesPayload,
}
export const movePipettes = (payload: MovePipettesPayload): MovePipettesAction => ({
  type: 'MOVE_PIPETTES',
  payload,
})
