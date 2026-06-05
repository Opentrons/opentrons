import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { useInterval } from '@opentrons/components'

import { checkShellUpdate } from '/app/redux/shell'

import type { Dispatch } from '/app/redux/types'

const UPDATE_RECHECK_INTERVAL_MS = 60000

export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = useCallback(
    () => dispatch(checkShellUpdate()),
    [dispatch]
  )
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}
