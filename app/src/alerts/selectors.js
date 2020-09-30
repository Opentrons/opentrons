// @flow
import { createSelector } from 'reselect'
import without from 'lodash/without'

import { getConfig } from '../config'

import type { State } from '../types'
import type { AlertId } from './types'

const getIgnoredAlertsFromConfig: (
  state: State
) => null | $ReadOnlyArray<string> = createSelector(
  getConfig,
  config => config?.alerts.ignored ?? null
)

export const getActiveAlerts: (
  state: State
) => $ReadOnlyArray<AlertId> = createSelector(
  state => state.alerts,
  getIgnoredAlertsFromConfig,
  (alerts, ignoredAlerts) => {
    // only return active alerts if we know which alerts (if any) have been
    // permanently ignored
    return ignoredAlerts !== null
      ? without(alerts.active, ...alerts.ignored, ...ignoredAlerts)
      : []
  }
)
