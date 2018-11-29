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
  parentUrl: string,
  onClick: () => mixed,
}

export default function UpdateAppModal (props: Props) {
  const {parentUrl, versionProps, onClick} = props
  const HEADING = `Version ${versionProps.availableUpdate} available`
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {
          Component: Link,
          to: parentUrl,
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
