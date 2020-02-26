// @flow
import { combineEpics } from 'redux-observable'

import { fetchWifiKeysEpic } from './fetchWifiKeysEpic'
import { statusEpic } from './statusEpic'
import { wifiConfigureEpic } from './wifiConfigureEpic'
import { wifiListEpic } from './wifiListEpic'

import type { Epic } from '../../types'

export const networkingEpic: Epic = combineEpics(
  fetchWifiKeysEpic,
  statusEpic,
  wifiConfigureEpic,
  wifiListEpic
)
