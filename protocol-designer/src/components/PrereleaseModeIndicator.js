// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Icon } from '@opentrons/components'
import { selectors as featureFlagSelectors } from '../feature-flags'

export const PrereleaseModeIndicator = () => {
  const prereleaseModeEnabled = useSelector(
    featureFlagSelectors.getEnabledPrereleaseMode
  )

  return prereleaseModeEnabled === true ? (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'red',
        height: '2rem',
        zIndex: 9999,
      }}
    >
      <Icon name="alert" height="2rem" />
    </div>
  ) : null
}
