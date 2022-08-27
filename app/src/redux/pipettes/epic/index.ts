import { combineEpics } from 'redux-observable'
import { fetchPipettesEpic } from './fetchPipettesEpic'
import { fetchPipetteSettingsEpic } from './fetchPipetteSettingsEpic'
import { updatePipetteSettingsEpic } from './updatePipetteSettingsEpic'
import type { Epic } from '../../types'

export const pipettesEpic: Epic = combineEpics<Epic>(
  fetchPipettesEpic,
  fetchPipetteSettingsEpic,
  updatePipetteSettingsEpic
)
