// @flow
import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchEapOptionsEpic } from './fetchEapOptionsEpic'
import { fetchWifiKeysEpic } from './fetchWifiKeysEpic'
import { postWifiKeysEpic } from './postWifiKeysEpic'
import { statusEpic } from './statusEpic'
import { wifiConfigureEpic } from './wifiConfigureEpic'
import { wifiListEpic } from './wifiListEpic'
import { disconnectEpic } from './disconnectEpic'

export const networkingEpic: Epic = combineEpics(
  fetchEapOptionsEpic,
  fetchWifiKeysEpic,
  postWifiKeysEpic,
  statusEpic,
  wifiConfigureEpic,
  wifiListEpic,
  disconnectEpic
)
