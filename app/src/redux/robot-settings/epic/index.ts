// @flow
import { combineEpics } from 'redux-observable'
import type { Epic } from '../../types'

import { fetchSettingsEpic } from './fetchSettingsEpic'
import { updateSettingEpic } from './updateSettingEpic'
import { clearRestartPathEpic } from './clearRestartPathEpic'

export const robotSettingsEpic: Epic = combineEpics(
  fetchSettingsEpic,
  updateSettingEpic,
  clearRestartPathEpic
)
