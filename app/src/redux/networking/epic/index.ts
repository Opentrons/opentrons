import { combineEpics } from 'redux-observable'
import type { Epic } from '../../types'
import { disconnectEpic } from './disconnectEpic'
import { fetchEapOptionsEpic } from './fetchEapOptionsEpic'
import { fetchWifiKeysEpic } from './fetchWifiKeysEpic'
import { postWifiKeysEpic } from './postWifiKeysEpic'
import { statusEpic } from './statusEpic'
import { wifiConfigureEpic } from './wifiConfigureEpic'

export const networkingEpic: Epic = combineEpics<Epic>(
  fetchEapOptionsEpic,
  fetchWifiKeysEpic,
  postWifiKeysEpic,
  statusEpic,
  wifiConfigureEpic,
  disconnectEpic
)
