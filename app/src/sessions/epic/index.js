// @flow
import { combineEpics } from 'redux-observable'
import { createRobotSessionEpic } from './createRobotSessionEpic'
import { fetchRobotSessionEpic } from './fetchRobotSessionEpic'
import { updateRobotSessionEpic } from './updateRobotSessionEpic'
import { deleteRobotSessionEpic } from './deleteRobotSessionEpic'

import type { Epic } from '../../types'

export const sessionsEpic: Epic = combineEpics(
  createRobotSessionEpic,
  fetchRobotSessionEpic,
  updateRobotSessionEpic,
  deleteRobotSessionEpic
)
