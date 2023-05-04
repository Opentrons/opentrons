import type { Epic } from '../../types'
import { fetchPipetteSettingsEpic } from './fetchPipetteSettingsEpic'
import { fetchPipettesEpic } from './fetchPipettesEpic'
import { updatePipetteSettingsEpic } from './updatePipetteSettingsEpic'
import { combineEpics } from 'redux-observable'

export const pipettesEpic: Epic = combineEpics<Epic>(
  fetchPipettesEpic,
  fetchPipetteSettingsEpic,
  updatePipetteSettingsEpic
)
