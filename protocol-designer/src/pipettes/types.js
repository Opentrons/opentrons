// @flow

import type {PipetteData} from '../step-generation'
import type {PipetteFields} from '../load-file'

export type PipetteReducerState = {
  byMount: {|
    left: ?string,
    right: ?string,
  |},
  byId: {
    [pipetteId: string]: PipetteData,
  },
}

export type UpdatePipettesAction = {
  type: 'UPDATE_PIPETTES',
  payload: PipetteReducerState,
}

export type EditPipettesFields = {
  left: PipetteFields,
  right: PipetteFields,
}
