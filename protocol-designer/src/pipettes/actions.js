// @flow
import type {PipetteName} from './pipetteData'

type UpdatePipettesPayload = {
  leftModel: ?string,
  rightModel: ?string,
  leftTiprackModel: ?string,
  rightTiprackModel: ?string
}
export const updatePipettes = (payload: UpdatePipettesPayload) => ({
  type: 'UPDATE_PIPETTES',
  payload
})
