// @flow
import { combineEpics } from 'redux-observable'
import { fetchPipettesEpic } from './fetchPipettesEpic'
import type { Epic } from '../../types'

export const pipettesEpic: Epic = combineEpics(fetchPipettesEpic)
