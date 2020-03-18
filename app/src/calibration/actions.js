// @flow
import type { StartDeckCheckAction } from './types'
import { START_DECK_CHECK } from './constants'

export const startDeckCheck = (robotName: string): StartDeckCheckAction => ({
  type: START_DECK_CHECK,
  meta: { robotName },
})
