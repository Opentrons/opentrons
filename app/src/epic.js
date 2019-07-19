// @flow
// root application epic
import { combineEpics } from 'redux-observable'
import { robotApiEpic } from './robot-api'
import { buildrootUpdateEpic } from './shell'

export default combineEpics(robotApiEpic, buildrootUpdateEpic)
