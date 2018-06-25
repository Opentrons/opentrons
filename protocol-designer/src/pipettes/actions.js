// @flow
import type {PipetteName} from './pipetteData'

export const updatePipettes = (payload: {'left'?: ?PipetteName, 'right'?: ?PipetteName}) => ({
  type: 'UPDATE_PIPETTES',
  payload
})
