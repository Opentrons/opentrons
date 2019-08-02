// @flow
// root application epic
import { combineEpics } from 'redux-observable'

import { buildrootUpdateEpic } from './shell'
import { discoveryEpic } from './discovery'
import { robotApiEpic } from './robot-api'

export default combineEpics(buildrootUpdateEpic, discoveryEpic, robotApiEpic)
