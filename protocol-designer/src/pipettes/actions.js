// @flow
import type {PipetteName} from './pipetteData'

type UpdatePipettesPayload = {
  left: ?PipetteName,
  right: ?PipetteName,
  leftTiprackModel: ?string,
  rightTiprackModel: ?string
}
export const updatePipettes = (payload: UpdatePipettesPayload) => ({
  type: 'UPDATE_PIPETTES',
  payload
})
