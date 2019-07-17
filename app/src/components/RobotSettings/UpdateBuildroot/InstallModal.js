// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'

import { AlertModal } from '@opentrons/components'

type Props = {
  parentUrl: string,
  ignoreUpdate: () => mixed,
}

export default function InstallModal(props: Props) {
  return (
    <AlertModal
      heading="Feature not Implemented"
      buttons={[
        {
          Component: Link,
          to: props.parentUrl,
          children: 'not now',
          onClick: props.ignoreUpdate,
        },
      ]}
      alertOverlay
    >
      <p>TODO: Check Migration vs Update</p>
    </AlertModal>
  )
}
