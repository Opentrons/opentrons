import { combineEpics } from 'redux-observable'
import { fetchPipettesEpic } from './fetchPipettesEpic'
import { fetchPipettesOnConnectEpic } from './fetchPipettesOnConnectEpic'
import { fetchPipetteSettingsEpic } from './fetchPipetteSettingsEpic'
import { updatePipetteSettingsEpic } from './updatePipetteSettingsEpic'
import type { Epic } from '../../types'

export const pipettesEpic: Epic = combineEpics<Epic>(
  fetchPipettesEpic,
  fetchPipettesOnConnectEpic,
  fetchPipetteSettingsEpic,
  updatePipetteSettingsEpic
)
