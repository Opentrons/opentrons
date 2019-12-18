// @flow
// root application epic
import { combineEpics } from 'redux-observable'

import { analyticsEpic } from './analytics'
import { discoveryEpic } from './discovery/epic'
import { robotAdminEpic } from './robot-admin/epic'
import { robotControlsEpic } from './robot-controls/epic'
import { robotSettingsEpic } from './robot-settings/epic'
import { pipettesEpic } from './pipettes/epic'
import { modulesEpic } from './modules/epic'
import { shellEpic } from './shell'

export default combineEpics(
  analyticsEpic,
  discoveryEpic,
  robotAdminEpic,
  robotControlsEpic,
  robotSettingsEpic,
  pipettesEpic,
  modulesEpic,
  shellEpic
)
