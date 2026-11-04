import { createSelector } from 'reselect'

import { getConfig } from '/app/redux/config/selectors'

import type { State } from '/app/redux/types'

export const getAuditLogDirectory: (state: State) => string | null =
  createSelector(getConfig, config => config?.audit?.logDirectory ?? null)
