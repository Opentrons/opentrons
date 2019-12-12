// @flow
// root application epic
import { combineEpics } from 'redux-observable'

import { analyticsEpic } from './analytics'
import { discoveryEpic } from './discovery/epic'
import { robotApiEpic } from './robot-api'
import { robotAdminEpic } from './robot-admin/epic'
import { robotSettingsEpic } from './robot-settings/epic'
import { pipettesEpic } from './pipettes/epic'
import { modulesEpic } from './modules/epic'
import { shellEpic } from './shell'

export default combineEpics(
  analyticsEpic,
  discoveryEpic,
  robotApiEpic,
  robotAdminEpic,
  robotSettingsEpic,
  pipettesEpic,
  modulesEpic,
  shellEpic
)
