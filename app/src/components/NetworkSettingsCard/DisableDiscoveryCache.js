// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { LabeledToggle } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import { getConfig, updateConfig } from '../../config'

export const DisableDiscoveryCache = () => {
  const cacheDisabled = useSelector((state: State) => {
    const config = getConfig(state)
    return config.discovery.disableCache
  })
  const dispatch = useDispatch<Dispatch>()
  return (
    <LabeledToggle
      label="Disable robot caching"
      toggledOn={cacheDisabled}
      onClick={() => {
        dispatch(updateConfig('discovery.disableCache', !cacheDisabled))
      }}
    >
      <p>
        NOTE: This will clear cached robots when switched ON.
      </p>
      <p>
        Disable caching of previously seen robots. Enabling this setting may
        improve overall networking performance in environments with many OT-2s,
        but may cause initial OT-2 discovery on app launch to be slower and more
        susceptible to failures.
      </p>
    </LabeledToggle>
  )
}
