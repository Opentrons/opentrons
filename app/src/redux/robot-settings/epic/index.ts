import { combineEpics } from 'redux-observable'

import { fetchSettingsEpic } from './fetchSettingsEpic'
import { updateSettingEpic } from './updateSettingEpic'

import type { Epic } from '../../types'

export const robotSettingsEpic: Epic = combineEpics<Epic>(
  fetchSettingsEpic,
  updateSettingEpic
)
