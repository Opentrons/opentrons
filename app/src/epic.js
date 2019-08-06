// @flow
// root application epic
import { combineEpics } from 'redux-observable'

import { discoveryEpic } from './discovery'
import { robotApiEpic } from './robot-api'
import { shellEpic } from './shell'

export default combineEpics(discoveryEpic, robotApiEpic, shellEpic)
