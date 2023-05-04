// root application epic
import { alertsEpic } from './alerts/epic'
import { analyticsEpic } from './analytics/epic'
import { buildrootEpic } from './buildroot/epic'
import { calibrationEpic } from './calibration/epic'
import { discoveryEpic } from './discovery/epic'
import { modulesEpic } from './modules/epic'
import { networkingEpic } from './networking/epic'
import { pipettesEpic } from './pipettes/epic'
import { robotAdminEpic } from './robot-admin/epic'
import { robotControlsEpic } from './robot-controls/epic'
import { robotSettingsEpic } from './robot-settings/epic'
import { sessionsEpic } from './sessions/epic'
import { shellEpic } from './shell/epic'
import { systemInfoEpic } from './system-info/epic'
import type { Epic } from './types'
import { combineEpics } from 'redux-observable'

export const rootEpic = combineEpics<Epic>(
  analyticsEpic,
  discoveryEpic,
  robotAdminEpic,
  robotControlsEpic,
  robotSettingsEpic,
  buildrootEpic,
  pipettesEpic,
  modulesEpic,
  networkingEpic,
  shellEpic,
  alertsEpic,
  systemInfoEpic,
  sessionsEpic,
  calibrationEpic
)
