import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { LabeledToggle } from '@opentrons/components'
import type { State, Dispatch } from '../../../redux/types'
import { getConfig, toggleConfigValue } from '../../../redux/config'

export const DisableDiscoveryCache = (): JSX.Element => {
  const dispatch = useDispatch<Dispatch>()
  const cacheDisabled = useSelector((state: State) => {
    return getConfig(state)?.discovery.disableCache ?? false
  })

  return (
    <LabeledToggle
      label="Disable robot caching"
      toggledOn={cacheDisabled}
      onClick={() => dispatch(toggleConfigValue('discovery.disableCache'))}
    >
      <p>NOTE: This will clear cached robots when switched ON.</p>
      <p>
        Disable caching of previously seen robots. Enabling this setting may
        improve overall networking performance in environments with many OT-2s,
        but may cause initial OT-2 discovery on app launch to be slower and more
        susceptible to failures.
      </p>
    </LabeledToggle>
  )
}
