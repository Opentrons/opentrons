import { checkShellUpdate } from '../redux/shell'
import type { Dispatch } from '../redux/types'
import { useInterval } from '@opentrons/components'
import * as React from 'react'
import { useDispatch } from 'react-redux'

const UPDATE_RECHECK_INTERVAL_MS = 60000
export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}
