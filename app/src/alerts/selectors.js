// @flow
import { createSelector } from 'reselect'
import without from 'lodash/without'

import { getConfig } from '../config'

import type { State } from '../types'
import type { AlertId } from './types'

const getIgnoredAlertsFromConfig: (
  state: State
) => $ReadOnlyArray<string> = createSelector(
  getConfig,
  config => config?.alerts.ignored ?? []
)

export const getActiveAlerts: (
  state: State
) => $ReadOnlyArray<AlertId> = createSelector(
  state => state.alerts,
  getIgnoredAlertsFromConfig,
  (alerts, ignoredAlerts) => {
    return without(alerts.active, ...alerts.ignored, ...ignoredAlerts)
  }
)
