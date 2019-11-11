// @flow

import * as Types from './types'
import type { State } from '../types'

const getPipettesState = (state: State) => state.pipettes

export const getAttachedPipettes = (
  state: State,
  robotName: string
): Types.AttachedPipettesByMount => {
  return (
    getPipettesState(state)[robotName]?.attachedByMount || {
      left: null,
      right: null,
    }
  )
}
