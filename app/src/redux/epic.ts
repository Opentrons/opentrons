// root application epic
import { combineEpics } from 'redux-observable'

import { alertsEpic } from './alerts/epic'
import { analyticsEpic } from './analytics/epic'
import { discoveryEpic } from './discovery/epic'
import { shellEpic } from './shell/epic'
import { systemInfoEpic } from './system-info/epic'

import type { Epic } from './types'

export const rootEpic = combineEpics<Epic>(
  analyticsEpic,
  discoveryEpic,
  shellEpic,
  alertsEpic,
  systemInfoEpic
)
