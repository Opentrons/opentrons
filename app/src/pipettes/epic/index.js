// @flow
import { combineEpics } from 'redux-observable'
import type { Epic } from '../../types'
import { fetchPipettesEpic } from './fetchPipettesEpic'
import { fetchPipettesOnConnectEpic } from './fetchPipettesOnConnectEpic'
import { fetchPipetteSettingsEpic } from './fetchPipetteSettingsEpic'
import { updatePipetteSettingsEpic } from './updatePipetteSettingsEpic'

export const pipettesEpic: Epic = combineEpics(
  fetchPipettesEpic,
  fetchPipettesOnConnectEpic,
  fetchPipetteSettingsEpic,
  updatePipetteSettingsEpic
)
