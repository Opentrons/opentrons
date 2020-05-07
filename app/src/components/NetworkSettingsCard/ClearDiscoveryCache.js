// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { clearDiscoveryCache } from '../../discovery'
import { LabeledButton } from '@opentrons/components'

// TODO(mc, 2020-04-27): i18n
const CLEAR = 'clear'
const CLEAR_ROBOTS_TITLE = 'Clear Discovered Robots List'
const CLEAR_ROBOTS_DESCRIPTION =
  'If your app has unused robots in its list, click to clear the cache & remove them.'

import type { Dispatch } from '../../types'

export function ClearDiscoveryCache() {
  const dispatch = useDispatch<Dispatch>()
  return (
    <LabeledButton
      label={CLEAR_ROBOTS_TITLE}
      buttonProps={{
        onClick: () => dispatch(clearDiscoveryCache()),
        children: CLEAR,
      }}
    >
      <p>{CLEAR_ROBOTS_DESCRIPTION}</p>
    </LabeledButton>
  )
}
