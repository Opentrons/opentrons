// root application epic
import { combineEpics } from 'redux-observable'

import { alertsEpic } from './alerts/epic'
import { analyticsEpic } from './analytics/epic'
import { calibrationEpic } from './calibration/epic'
import { discoveryEpic } from './discovery/epic'
import { modulesEpic } from './modules/epic'
import { networkingEpic } from './networking/epic'
import { robotAdminEpic } from './robot-admin/epic'
import { robotUpdateEpic } from './robot-update/epic'
import { sessionsEpic } from './sessions/epic'
import { shellEpic } from './shell/epic'
import { systemInfoEpic } from './system-info/epic'

import type { Epic } from './types'

export const rootEpic = combineEpics<Epic>(
  analyticsEpic,
  discoveryEpic,
  robotAdminEpic,
  robotUpdateEpic,
  modulesEpic,
  networkingEpic,
  shellEpic,
  alertsEpic,
  systemInfoEpic,
  sessionsEpic,
  calibrationEpic
)
