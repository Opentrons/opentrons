import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useInterval } from '@opentrons/components'
import { checkShellUpdate } from '../redux/shell'

import type { Dispatch } from '../redux/types'

const UPDATE_RECHECK_INTERVAL_MS = 60000

/**
 * A hook that polls for software updates on a set interval.
 *
 * @returns {void}
 */
export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}
