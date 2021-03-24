import { createSelector } from 'reselect'
import without from 'lodash/without'

import { getConfig } from '../config'

import type { State } from '../types'
import type { AlertId } from './types'

const getIgnoredAlertsFromConfig: (
  state: State
) => null | $ReadOnlystring[] = createSelector(
  getConfig,
  config => config?.alerts.ignored ?? null
)

export const getActiveAlerts: (
  state: State
) => $ReadOnlyAlertId[] = createSelector(
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

export const getAlertIsPermanentlyIgnored = (
  state: State,
  alertId: AlertId
): boolean | null => {
  const permaIgnoreList = getIgnoredAlertsFromConfig(state)
  return permaIgnoreList ? permaIgnoreList.includes(alertId) : null
}
