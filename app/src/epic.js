// @flow
// root application epic
import { combineEpics } from 'redux-observable'

import { analyticsEpic } from './analytics/epic'
import { supportEpic } from './support/epic'
import { discoveryEpic } from './discovery/epic'
import { robotAdminEpic } from './robot-admin/epic'
import { robotControlsEpic } from './robot-controls/epic'
import { robotSettingsEpic } from './robot-settings/epic'
import { buildrootEpic } from './buildroot/epic'
import { pipettesEpic } from './pipettes/epic'
import { modulesEpic } from './modules/epic'
import { networkingEpic } from './networking/epic'
import { shellEpic } from './shell/epic'
import { alertsEpic } from './alerts/epic'
import { systemInfoEpic } from './system-info/epic'
import { sessionsEpic } from './sessions/epic'
import { calibrationEpic } from './calibration/epic'

import type { Epic } from './types'

export const rootEpic: Epic = combineEpics(
  analyticsEpic,
  supportEpic,
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
