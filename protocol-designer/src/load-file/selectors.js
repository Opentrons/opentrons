// @flow
import {createSelector} from 'reselect'
import type {BaseState} from '../types'
import type {RootState} from './reducers'

export const rootSelector = (state: BaseState): RootState => state.loadFile

export const getFileLoadErrors = createSelector(
  rootSelector,
  s => s.fileErrors
)
