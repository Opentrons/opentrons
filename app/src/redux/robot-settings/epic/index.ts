import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { clearRestartPathEpic } from './clearRestartPathEpic'
import { fetchSettingsEpic } from './fetchSettingsEpic'
import { updateSettingEpic } from './updateSettingEpic'

export const robotSettingsEpic: Epic = combineEpics<Epic>(
  fetchSettingsEpic,
  updateSettingEpic,
  clearRestartPathEpic
)
