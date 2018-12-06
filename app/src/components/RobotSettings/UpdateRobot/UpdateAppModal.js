// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import {AlertModal} from '@opentrons/components'
import UpdateAppMessage from './UpdateAppMessage'
import VersionList from './VersionList'
import SkipAppUpdateMessage from './SkipAppUpdateMessage'

import type {VersionProps} from './types'

type Props = {
  versionProps: VersionProps,
  ignoreUpdate: () => mixed,
  onClick: () => mixed,
}

export default function UpdateAppModal (props: Props) {
  const {versionProps, onClick, ignoreUpdate} = props
  const HEADING = `Robot Server Version ${
    versionProps.availableUpdate
  } Available`
  return (
    <AlertModal
      heading={HEADING}
      // Ignore available robot update on robot, set app update to seen in state
      // TODO: set app update to seen
      buttons={[
        {
          onClick: ignoreUpdate,
          children: 'not now',
        },
        {
          Component: Link,
          to: '/menu/app/update',
          children: 'View App Update',
        },
      ]}
      alertOverlay
    >
      <UpdateAppMessage {...versionProps} />
      <VersionList {...versionProps} />
      <SkipAppUpdateMessage onClick={onClick} />
    </AlertModal>
  )
}
