import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchPipettesEpic } from './fetchPipettesEpic'
import { fetchPipetteSettingsEpic } from './fetchPipetteSettingsEpic'
import { updatePipetteSettingsEpic } from './updatePipetteSettingsEpic'

export const pipettesEpic: Epic = combineEpics<Epic>(
  fetchPipettesEpic,
  fetchPipetteSettingsEpic,
  updatePipetteSettingsEpic
)
