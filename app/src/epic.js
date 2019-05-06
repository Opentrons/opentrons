// @flow
// root application epic
import { combineEpics } from 'redux-observable'
import { robotApiEpic } from './robot-api'

export default combineEpics(robotApiEpic)
