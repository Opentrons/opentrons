// @flow
// root application epic
import { combineEpics } from 'redux-observable'

import { analyticsEpic } from './analytics'
import { buildrootUpdateEpic } from './shell'
import { discoveryEpic } from './discovery'
import { robotApiEpic } from './robot-api'

export default combineEpics(
  analyticsEpic,
  buildrootUpdateEpic,
  discoveryEpic,
  robotApiEpic
)
