// @flow
import {createSelector} from 'reselect'
import type {BaseState} from '../../types'
import type {RootState} from '../reducers'

export const rootSelector = (state: BaseState): RootState => state.fileData

export const fileFormValues = createSelector(
  rootSelector,
  state => state.metadataFields
)
